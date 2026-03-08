const{Client} = require("pg");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const {config}=require('dotenv');
config();

const signUpController=async(req,res)=>{
    try {
    const { email, name, password, confirmPassword } = req.body;

    if(password !== confirmPassword){
      return res.status(400).json({message:"Passwords do not match"});
    }

    const client = new Client({
      user: process.env.DB_USER,
      password:process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    });
    await client.connect();

    const users_by_email=await client.query(`SELECT * FROM "user" WHERE email = '${email}'`);

    if(users_by_email.rows.length>0){
      return res.status(400).json({message:"User already exists with this email"});
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    

    await client.query(`INSERT INTO "user" (email, name, password) VALUES ('${email}', '${name}', '${hashedPassword}')`);
    await client.end();
    const payload = { name, email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(201).json({
      message: "User created successfully",
      token,
    });        
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:error.toString()});
    }

}

const signInController=async(req,res)=>{
    try {
        
        const { email, password } = req.body;
        
        const client = new Client({
          user: process.env.DB_USER,
          password:process.env.DB_PASSWORD,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
        });
        await client.connect();

        const users_by_email=await client.query(`SELECT * FROM "user" WHERE email = '${email}'`);
        if(users_by_email.rows.length===0){
            return res.status(400).json({message:"User does not exist with this email"});
        }

        user=users_by_email.rows[0];
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({message:"Unauthorized: Invalid email or password"});
        }
        const payload = { userId: user.user_id, email: user.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        return res.status(200).json({
            message: "Sign in successful",
            token,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:error.toString()});
    }
}
module.exports={signUpController, signInController};