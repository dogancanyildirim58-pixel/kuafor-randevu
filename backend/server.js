const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB bağlandı"))
  .catch((err) => console.log("MongoDB hata:", err));

const AppointmentSchema = new mongoose.Schema({
  customerName: String,
  phone: String,
  service: String,
  price: String,
  duration: Number,
  barberName: String,
  date: String,
  time: String,
}, { timestamps: true });

const Appointment = mongoose.model("Appointment", AppointmentSchema);

app.get("/", (req, res) => {
  res.send("Kuaför API çalışıyor");
});

app.get("/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Randevular alınamadı" });
  }
});

app.post("/appointments", async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);
    const appointments = await Appointment.find().sort({ createdAt: -1 });

    res.json({
      message: "Randevu oluşturuldu",
      appointment,
      appointments,
    });
  } catch (err) {
    res.status(500).json({ message: "Randevu oluşturulamadı" });
  }
});

app.put("/appointments/:id", async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(req.params.id, req.body);
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: "Güncellenemedi" });
  }
});

app.delete("/appointments/:id", async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: "Silinemedi" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server çalışıyor: ${PORT}`);
});