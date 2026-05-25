require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB bağlandı"))
  .catch((err) => console.log("MongoDB hata:", err));

const appointmentSchema = new mongoose.Schema(
  {
    customerName: String,
    phone: String,
    service: String,
    price: String,
    barberName: String,
    date: String,
    time: String,
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

app.get("/", (req, res) => {
  res.send("Kuaför API çalışıyor");
});

app.get("/appointments", async (req, res) => {
  const appointments = await Appointment.find().sort({ createdAt: -1 });
  res.json(appointments);
});

app.post("/appointments", async (req, res) => {
  const appointment = await Appointment.create(req.body);
  const appointments = await Appointment.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    appointment,
    appointments,
  });
});

app.put("/appointments/:id", async (req, res) => {
  await Appointment.findByIdAndUpdate(req.params.id, req.body);

  const appointments = await Appointment.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    appointments,
  });
});

app.delete("/appointments/:id", async (req, res) => {
  await Appointment.findByIdAndDelete(req.params.id);

  const appointments = await Appointment.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    appointments,
  });
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server çalışıyor: http://localhost:${process.env.PORT || 5000}`);
});