import nodemailer from 'nodemailer'


export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'fabioarredondo44@gmail.com',
      pass: 'pvogmtgydauppsrs'
    }
  }); 

  transporter.verify().then(()=> {
    console.log('funcionando para mandar gmails')
  })