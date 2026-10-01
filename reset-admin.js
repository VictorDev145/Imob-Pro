require("dotenv").config();
const Database=require("better-sqlite3");
const bcrypt=require("bcryptjs");
const path=require("path");
const db=new Database(process.env.DB_PATH||path.join(__dirname,"imobpro.sqlite"));
const email=String(process.argv[2]||process.env.ADMIN_EMAIL||"").trim().toLowerCase();
const password=String(process.argv[3]||process.env.ADMIN_PASSWORD||"");
if(!email||password.length<10){console.error("Uso: node reset-admin.js email senha-com-10-ou-mais-caracteres");process.exit(1)}
const user=db.prepare("SELECT id FROM users WHERE lower(email)=? AND role='admin'").get(email);
if(!user){console.error("Administrador não encontrado para esse e-mail.");process.exit(2)}
db.prepare("UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(bcrypt.hashSync(password,12),user.id);
db.prepare("DELETE FROM sessions").run();
console.log("Senha administrativa redefinida com sucesso para:",email);