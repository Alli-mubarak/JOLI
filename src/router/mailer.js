import express from 'express'; 
const router = express.Router();
import geoip from "geoip-lite";
import {pool} from '../config/db.js'; 

router.get('/mails', (req, res) => {
  try{
  res.json({ message: 'Fetching all mails' });
  }catch(err){
    res.json({ message: 'Error fetching all mails', error: err });
  }
});
    
export default router;
