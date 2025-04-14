import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { Usuario, loginSchema } from "@shared/schema";
import { z } from "zod";
import { logger } from "./logger";

// Middleware para verificar autenticação
const verificarAutenticacao = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ mensagem: "Usuário não autenticado" });
  }
  next();
};

declare global {
  namespace Express {
    interface User extends Usuario {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    if (!stored || !stored.includes(".")) {
      return false;
    }
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Erro na comparação de senhas:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "psisystem-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
      httpOnly: true
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "senha"
      },
      async (email, senha, done) => {
        try {
          console.log("Tentativa de login para:", email);
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log("Usuário não encontrado");
            return done(null, false, { message: "Email ou senha incorretos" });
          }
          
          const senhaCorreta = await comparePasswords(senha, user.senha);
          console.log("Senha está correta:", senhaCorreta);
          
          if (!senhaCorreta) {
            return done(null, false, { message: "Email ou senha incorretos" });
          }
          
          return done(null, user);
        } catch (error) {
          console.error("Erro no login:", error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).send("Email já está em uso");
      }

      // Verificar tipo de usuário válido
      const tiposValidos = ["admin", "secretaria", "psicologo", "paciente"];
      if (!tiposValidos.includes(req.body.tipo)) {
        return res.status(400).send("Tipo de usuário inválido");
      }

      const user = await storage.createUser({
        ...req.body,
        senha: await hashPassword(req.body.senha)
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors
        });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      const { email, senha } = loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: Usuario, info: any) => {
        if (err) return next(err);
        
        if (!user) {
          return res.status(401).json({ message: info.message || "Email ou senha incorretos" });
        }
        
        req.login(user, (err) => {
          if (err) return next(err);
          return res.json(user);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors
        });
      }
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      logger.info("Acesso não autenticado à rota /api/user");
      return res.status(401).json({ mensagem: "Usuário não autenticado" });
    }
    res.json(req.user);
  });

  // Rota para solicitar redefinição de senha
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false,
          message: "Email não fornecido" 
        });
      }
      
      // Verificar se o email existe no sistema
      const usuario = await storage.getUserByEmail(email);
      
      // Por segurança, não revelamos se o email existe ou não
      // Retornamos uma mensagem genérica para ambos os casos
      return res.status(200).json({ 
        success: true,
        message: "Se o email estiver cadastrado em nosso sistema, você receberá instruções para redefinir sua senha."
      });
      
    } catch (error) {
      logger.error("Erro ao processar solicitação de redefinição de senha:", error);
      return res.status(500).json({ 
        success: false,
        message: "Erro ao processar solicitação de redefinição de senha"
      });
    }
  });
  
  // Endpoint para alterar senha do usuário autenticado
  app.post("/api/change-password", verificarAutenticacao, async (req, res) => {
    try {
      const { senhaAtual, novaSenha } = req.body;
      
      if (!senhaAtual || !novaSenha) {
        return res.status(400).json({
          success: false,
          message: "Senha atual e nova senha são obrigatórias"
        });
      }
      
      // Como o middleware verificarAutenticacao já garante que req.user existe
      // O TypeScript ainda pode não reconhecer isso, então usamos o operador ! para afirmar que não é undefined
      const userId = req.user!.id;
      
      // Verificar se a senha atual está correta
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado"
        });
      }
      
      const senhaCorreta = await comparePasswords(senhaAtual, user.senha);
      if (!senhaCorreta) {
        return res.status(400).json({
          success: false,
          message: "Senha atual incorreta"
        });
      }
      
      // Atualizar a senha
      const senhaCriptografada = await hashPassword(novaSenha);
      await storage.updateUser(user.id, { senha: senhaCriptografada });
      
      return res.status(200).json({
        success: true,
        message: "Senha alterada com sucesso"
      });
      
    } catch (error) {
      logger.error("Erro ao alterar senha:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao alterar senha"
      });
    }
  });
}
