const healthController=(req,res)=>{
    try {
        return res.status(200).json({message:"health ok"});
        
    } catch (error) {
        console.log(typeof(error));
        return res.status(500).json({message:error.toString()});
    }

}
module.exports={healthController}