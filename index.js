import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import cors from "cors"

const app = express();

app.use(bodyParser.json());
app.use(morgan("dev"));

app.use(cors())

app.use("/data", express.static(path.join(__dirname, "data.txt")));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/save", (req, res) => {
  try {
    const { name, email, phone, company, service, message } = req.body;
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
      Timestamp: new Date().toString(),
      Source: "Website",
    };

    const textContent = `${payload.Name},${payload.Email},${payload.Phone},${payload.Company},${payload.Service},${payload.Message},${payload.Timestamp},${payload.Source}`;
    const filePath = path.join(__dirname, "data.txt");

    fs.appendFile(filePath, textContent + "\n", (err) => {
      if (err) {
        console.error("Error writing to file:", err);
        return res.status(500).send("Failed to save");
      }
      //   res.send("Data saved");
    });

    return res.status(200).json({
      message: "Data saved successfully",
      status: true,
    });
  } catch (e) {
    console.log(e);
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
        console.error("Error writing to file:", err);
        return res.status(500).send("Failed to clear");
      }
    });
    return res.status(200).json({
      message: "Data cleared successfully",
      status: true,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: "Internal Server Error",
      status: false,
    });
  }
});

app.get("/getData", async (req, res) => {
  const fileUrl = "http://localhost:3000/data";
  //   const clearUrl = "https://celitix.com/landing/clear-submissions.php"; // We’ll create this

  const response = await axios.get(fileUrl);

  const content = response?.data?.trim();

  if (!content) {
    return res.status(400).json({
      message: "No new data",
      status: false,
    });
  }

  const lines = content.split("\n");
  const dataSheet = [];

  lines.forEach((line) => {
    const data = line.split(",");
    if (data.length >= 6) {
      dataSheet.push(data);
    }
  });

  return res.status(200).json({
    message: dataSheet,
    status: true,
  });
});

const port = 3000;

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
