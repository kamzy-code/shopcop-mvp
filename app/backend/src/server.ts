import { env } from "@config/env.js";
import app from "app.js";

const PORT = env.PORT

async function startServer(){
    app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);
    })
}

startServer();