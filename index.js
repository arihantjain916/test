import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const filesDir = path.join(__dirname, "files");
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Middleware
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors());
app.use("/files", express.static(filesDir));
app.use("/data", express.static(path.join(__dirname, "data.txt")));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/save", upload.single("file"), (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      service,
      message,
      source,
      designation,
      experience,
    } = req.body;
    let fileUrl = "";

    if (req.file) {
      fileUrl = `${req.protocol}://${req.get("host")}/files/${
        req.file.filename
      }`;
    }
    //   ["Name", "Email", "Phone", "Company", "Service", "Message", "Timestamp", "Source"]
    if (!name || !email || !phone || !company || !service || !message) {
      return res.status(400).json({
        message: "All fields are required",
        status: false,
      });
    }
    const payload = {
      Name: name,
      Email: email,
      Phone: phone,
      Company: company,
      Service: service,
      Message: message,
      Timestamp: new Date().toISOString("GMT+0530 (India Standard Time)"),
      Source: source || "Website",
      Experience: experience || "N/A",
      Designation: designation || "N/A",
    };

    const textContent = `${payload.Name},${payload.Email},${payload.Phone},${payload.Company},${payload.Service},${payload.Message},${payload.Timestamp},${payload.Source},${payload.Experience},${payload.Designation},${fileUrl},`;
    const filePath = path.join(__dirname, "data.txt");

    fs.appendFile(filePath, textContent + "\n", (err) => {
      if (err) {
        return res.status(500).send("Failed to save");
      }
      //   res.send("Data saved");
    });

    return res.status(200).json({
      message: "Data saved successfully",
      status: true,
      fileUrl,
    });
  } catch (e) {
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
});

app.get("/clear", (req, res) => {
  try {
    const filePath = path.join(__dirname, "data.txt");
    fs.writeFile(filePath, "", (err) => {
      if (err) {
        return res.status(500).send("Failed to clear");
      }
    });
    return res.status(200).json({
      message: "Data cleared successfully",
      status: true,
    });
  } catch (e) {
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
});

app.post("/send-email", (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      service,
      message,
      source = "website",
      designation,
      experience,
      resume,
    } = req.body;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "info@proactivedigital.in",
        pass: "womb nmot zyfb yqfp",
      },
    });

    var mailOptions = {};
    if (source === "careers") {
      mailOptions = {
        from: "ads@proactivedigital.in",
        to: "info@proactivedigital.in, sales@proactivesms.in, yogendra@proactivesms.in",
        subject: "Celitix Carrers Enquiry",
        html: `Name: ${name}<br>Email: ${email}<br>Phone: ${phone}<br>Message: ${message}<br>Designation: ${designation}<br>Experience: ${experience}<br>Resume: ${resume}`,
      };
    } else {
      mailOptions = {
        from: "ads@proactivedigital.in",
        to: "info@proactivedigital.in, sales@proactivesms.in, yogendra@proactivesms.in",
        subject: "Celitix Contact Enquiry",
        html: `Name: ${name}<br>Email: ${email}<br>Phone: ${phone}<br>Company: ${company}<br>Service: ${service}<br>Message: ${message}`,
      };
    }

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.status(500).json({
          message: "Internal Server Error",
          status: false,
        });
      } else {
        return res.status(200).json({
          message: "Email sent successfully",
          status: true,
        });
      }
    });
    return res.status(200).json({
      message: "Email sent successfully",
      status: true,
    });
  } catch (e) {
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: e.message,
    });
  }
});

app.post("/send-whatsapp", async (req, res) => {
  try {
    const { phone, name, service } = req.body;

    // headers
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `91${phone}`,
      type: "template",
      template: {
        name: "enquiry_response",
        language: {
          code: "en",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text", //name
                text: name,
              },
              {
                type: "text", //service
                text: service,
              },
            ],
          },
        ],
      },
    };

    const config = {
      headers: {
        key: "308c98f3d8XX",
        wabaNumber: "917230000091",
        "Content-Type": "application/json",
      },
    };

    const response = await axios.post(
      "https://api.celitix.com/wrapper/waba/message",
      payload,
      config
    );

    if (response?.data?.messages[0]?.message_status === "accepted") {
      return res.status(200).json({
        status: true,
      });
    } else {
      return res.status(200).json({
        status: false,
        message: response.data,
      });
    }
    // if(response?.message?.messages[0])
  } catch (e) {
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: e.message,
    });
  }
});

const port = 3000;

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
