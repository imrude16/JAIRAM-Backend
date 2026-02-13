import { sendMail } from "./email.client.js";
import CustomError from "../../common/errors/customError.js";  // Customer Error as of now doesn't exist but we can create it in the future to handle custom errors in a better way

const sendEmail = async ({
    to,
    subject,
    text,
    html,
    cc,
    bcc,
    attachments,
}) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: Array.isArray(to) ? to.join(",") : to,
            subject,
            text,
            html,
            cc,
            bcc,
            attachments,
        };

        const info = await sendMail(mailOptions);

        return info;
    } catch (error) {
        throw new CustomError("Failed to send email", 500);
    }
};

export default sendEmail ;