import express from 'express'; 
const router = express.Router();


router.get('/mails', (req, res) => {
  try{
  res.json({ message: 'Fetching all mails' });
  }catch(err){
    res.json({ message: 'Error fetching all mails', error: err });
  }
});


module.exports = router;
    
export default router;
