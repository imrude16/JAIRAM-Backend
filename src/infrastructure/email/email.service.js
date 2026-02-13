import { sendMail } from "./email.client";
import CustomError from "../../common/errors/customError";

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

export default { sendEmail };
