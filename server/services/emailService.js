require('dotenv').config();
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, firstName) => {
    try {
        const transporter = createTransporter();

        const resetURL = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        console.log('📧 Sending password reset email to:', email);
        console.log('🔗 Reset URL:', resetURL);

        const mailOptions = {
            from: {
                name: 'Social Connect',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: '🔐 Password Reset Request - Social Connect',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white !important; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              font-weight: bold; 
              margin: 20px 0; 
            }
            .warning { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              color: #856404; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .footer { 
              text-align: center; 
              font-size: 14px; 
              color: #666; 
              margin-top: 30px; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>We received a request to reset your password for your Social Connect account.</p>
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetURL}" class="button">Reset Your Password</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in 10 minutes for security reasons</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
              ${resetURL}
            </p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            
            <p>Best regards,<br>The Social Connect Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
        </html>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        return { success: false, error: error.message };
    }
};

// Send password reset confirmation email
const sendPasswordResetConfirmation = async (email, firstName) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: {
                name: 'Social Connect',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: '✅ Password Successfully Reset - Social Connect',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Confirmation</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
            }
            .header { 
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
            }
            .success { 
              background: #d4edda; 
              border: 1px solid #c3e6cb; 
              color: #155724; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Password Successfully Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <div class="success">
              <strong>Success!</strong> Your password has been successfully reset.
            </div>
            <p>You can now log in to your Social Connect account using your new password.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            <p>Best regards,<br>The Social Connect Team</p>
          </div>
        </body>
        </html>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset confirmation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Error sending confirmation email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendPasswordResetConfirmation
};
