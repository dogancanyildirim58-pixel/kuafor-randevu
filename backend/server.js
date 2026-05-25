const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB bağlandı");
  })
  .catch((err) => {
    console.log("MongoDB hata:", err);
  });

const RandevuSchema = new mongoose.Schema({
  adSoyad: String,
  telefon: String,
  hizmet: String,
  personel: String,
  tarih: String,
  saat: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Randevu = mongoose.model("Randevu", RandevuSchema);

app.get("/", (req, res) => {
  res.send("Kuaför API çalışıyor");
});

app.post("/randevu", async (req, res) => {
  try {
    const {
      adSoyad,
      telefon,
      hizmet,
      personel,
      tarih,
      saat,
    } = req.body;

    if (
      !adSoyad ||
      !telefon ||
      !hizmet ||
      !personel ||
      !tarih ||
      !saat
    ) {
      return res.status(400).json({
        success: false,
        message: "Eksik alan var",
      });
    }

    const yeniRandevu = new Randevu({
      adSoyad,
      telefon,
      hizmet,
      personel,
      tarih,
      saat,
    });

    await yeniRandevu.save();

    res.json({
      success: true,
      message: "Randevu oluşturuldu",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
    });
  }
});

app.get("/randevular", async (req, res) => {
  try {
    const randevular = await Randevu.find().sort({
      createdAt: -1,
    });

    res.json(randevular);
  } catch (error) {
    res.status(500).json({
      success: false,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server çalışıyor:", PORT);
});