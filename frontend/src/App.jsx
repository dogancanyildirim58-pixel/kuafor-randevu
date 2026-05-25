import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://kuafor-randevu.onrender.com";
const ADMIN_PASSWORD = "12345";

const barbers = ["Caner Usta", "Ahmet Usta", "Mehmet Usta"];

const services = [
  { name: "Saç Kesimi", price: "1500 TL", duration: 1 },
  { name: "Saç + Sakal", price: "2000 TL", duration: 1 },
  { name: "Sakal Kesimi", price: "500 TL", duration: 1 },
  { name: "Çocuk Saç Kesimi", price: "800 TL", duration: 1 },
  { name: "Keratin", price: "3000-4000 TL", duration: 3 },
  { name: "Perma", price: "4000 TL", duration: 4 },
  { name: "Cilt Bakımı", price: "1800 TL", duration: 1 },
];

const hours = [
  "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00",
];

function App() {
  const isAdminPage = window.location.pathname === "/admin";

  const [appointments, setAppointments] = useState([]);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [closedDays, setClosedDays] = useState([]);
  const [closedDateInput, setClosedDateInput] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [workingHours, setWorkingHours] = useState({
    "Caner Usta": { start: "10:00", end: "19:00" },
    "Ahmet Usta": { start: "10:00", end: "19:00" },
    "Mehmet Usta": { start: "10:00", end: "19:00" },
  });

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    service: "",
    price: "",
    duration: 1,
    barberName: "",
    date: "",
    time: "",
  });

  useEffect(() => {
    getAppointments();
  }, []);

  const getAppointments = async () => {
    try {
      const res = await axios.get(`${API}/appointments`);
      setAppointments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const getBlockedHours = (appointment) => {
    const startIndex = hours.indexOf(appointment.time);
    const duration = Number(appointment.duration || 1);
    if (startIndex === -1) return [];
    return hours.slice(startIndex, startIndex + duration);
  };

  const isClosedDay = (date) => closedDays.includes(date);

  const isOutsideWorkingHours = (hour, barberName) => {
    const config = workingHours[barberName];
    if (!config) return false;
    return hour < config.start || hour > config.end;
  };

  const isBusy = (hour) => {
    return appointments.some((a) => {
      if (a.barberName !== form.barberName || a.date !== form.date) return false;
      return getBlockedHours(a).includes(hour);
    });
  };

  const addAppointment = async () => {
    if (!form.customerName || !form.phone || !form.service || !form.barberName || !form.date || !form.time) {
      alert("Lütfen tüm alanları doldurun");
      return;
    }

    if (isClosedDay(form.date)) {
      alert("Bu gün kapalıdır");
      return;
    }

    if (isBusy(form.time)) {
      alert("Bu saat dolu");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API}/appointments`, form);
      setAppointments(res.data.appointments);

      setSuccessMessage(
        `${form.customerName} için ${form.date} ${form.time} randevusu oluşturuldu.`
      );

      const message =
        `Merhaba ${form.customerName}, randevunuz oluşturuldu.%0A%0A` +
        `İşlem: ${form.service}%0A` +
        `Kuaför: ${form.barberName}%0A` +
        `Tarih: ${form.date}%0A` +
        `Saat: ${form.time}%0A` +
        `Fiyat: ${form.price}`;

      window.open(`https://wa.me/90${form.phone}?text=${message}`, "_blank");

      setForm({
        customerName: "",
        phone: "",
        service: "",
        price: "",
        duration: 1,
        barberName: "",
        date: "",
        time: "",
      });
    } catch (err) {
      console.log(err);
      alert("Randevu oluşturulamadı. Backend/API bağlantısını kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAppointment = async (id) => {
    try {
      const res = await axios.delete(`${API}/appointments/${id}`);
      setAppointments(res.data.appointments);
    } catch (err) {
      alert("Silinemedi");
    }
  };

  const changeTime = async (appointment) => {
    const newTime = prompt("Yeni saat gir. Örnek: 14:00", appointment.time);
    if (!newTime) return;

    try {
      const res = await axios.put(`${API}/appointments/${appointment._id}`, {
        time: newTime,
      });

      setAppointments(res.data.appointments);

      const message =
        `Merhaba ${appointment.customerName}, randevu saatiniz güncellendi.%0A%0A` +
        `İşlem: ${appointment.service}%0A` +
        `Kuaför: ${appointment.barberName}%0A` +
        `Tarih: ${appointment.date}%0A` +
        `Yeni Saat: ${newTime}`;

      window.open(`https://wa.me/90${appointment.phone}?text=${message}`, "_blank");
    } catch (err) {
      alert("Saat değiştirilemedi");
    }
  };

  const addClosedDay = () => {
    if (!closedDateInput) return;
    if (closedDays.includes(closedDateInput)) {
      alert("Bu tarih zaten kapalı");
      return;
    }

    setClosedDays([...closedDays, closedDateInput]);
    setClosedDateInput("");
  };

  const removeClosedDay = (date) => {
    setClosedDays(closedDays.filter((d) => d !== date));
  };

  const updateWorkingHour = (barber, field, value) => {
    setWorkingHours({
      ...workingHours,
      [barber]: {
        ...workingHours[barber],
        [field]: value,
      },
    });
  };

  const loginAdmin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
    } else {
      alert("Şifre yanlış");
    }
  };

  const totalRevenue = appointments.reduce((total, a) => {
    const number = parseInt(String(a.price).replace(/\D/g, ""));
    return total + (isNaN(number) ? 0 : number);
  }, 0);

  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((a) => a.date === today);

  if (isAdminPage) {
    if (!isAdminLoggedIn) {
      return (
        <div style={styles.page}>
          <div style={styles.loginBox}>
            <h1 style={styles.title}>ADMIN PANEL</h1>

            <input
              style={styles.input}
              type="password"
              placeholder="Admin şifresi"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />

            <button style={styles.goldButtonFull} onClick={loginAdmin}>
              Giriş Yap
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.page}>
        <h1 style={styles.title}>ADMIN PANEL</h1>

        <div style={styles.dashboardGrid}>
          <div style={styles.statCard}>Toplam Randevu<br /><b>{appointments.length}</b></div>
          <div style={styles.statCard}>Bugünkü Randevu<br /><b>{todayAppointments.length}</b></div>
          <div style={styles.statCard}>Tahmini Ciro<br /><b>{totalRevenue.toLocaleString("tr-TR")} TL</b></div>
        </div>

        <div style={styles.panelCard}>
          <h2 style={styles.sectionTitle}>Kuaför Çalışma Saatleri</h2>

          {barbers.map((barber) => (
            <div key={barber} style={styles.workingRow}>
              <b>{barber}</b>

              <select
                style={styles.miniInput}
                value={workingHours[barber].start}
                onChange={(e) => updateWorkingHour(barber, "start", e.target.value)}
              >
                {hours.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>

              <select
                style={styles.miniInput}
                value={workingHours[barber].end}
                onChange={(e) => updateWorkingHour(barber, "end", e.target.value)}
              >
                {hours.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div style={styles.panelCard}>
          <h2 style={styles.sectionTitle}>Tatil / Kapalı Gün</h2>

          <div style={styles.row}>
            <input
              style={styles.input}
              type="date"
              value={closedDateInput}
              onChange={(e) => setClosedDateInput(e.target.value)}
            />

            <button style={styles.goldButton} onClick={addClosedDay}>
              Günü Kapat
            </button>
          </div>

          {closedDays.map((day) => (
            <div key={day} style={styles.closedDay}>
              {day}
              <button style={styles.redSmallButton} onClick={() => removeClosedDay(day)}>
                Aç
              </button>
            </div>
          ))}
        </div>

        {appointments.length === 0 && (
          <p style={styles.emptyText}>Henüz randevu yok.</p>
        )}

        {appointments.map((a) => (
          <div key={a._id} style={styles.card}>
            <h2>{a.customerName}</h2>
            <p>📞 {a.phone}</p>
            <p>✂️ {a.barberName}</p>
            <p>🔥 {a.service}</p>
            <p>💰 {a.price}</p>
            <p>⏳ {a.duration || 1} saat</p>
            <p>📅 {a.date}</p>
            <p>⏰ {a.time}</p>

            <div style={styles.adminButtons}>
              <button style={styles.goldButton} onClick={() => changeTime(a)}>
                Saat Değiştir
              </button>

              <button style={styles.redButton} onClick={() => deleteAppointment(a._id)}>
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>LUXURY BARBER</h1>
      </div>

      <div style={styles.formCard}>
        <input
          style={styles.input}
          placeholder="Ad Soyad"
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
        />

        <input
          style={styles.input}
          placeholder="Telefon"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <select
          style={styles.input}
          value={form.service}
          onChange={(e) => {
            const selected = services.find((s) => s.name === e.target.value);

            setForm({
              ...form,
              service: selected?.name || "",
              price: selected?.price || "",
              duration: selected?.duration || 1,
              barberName: "",
              date: "",
              time: "",
            });
          }}
        >
          <option value="">İşlem Seç</option>
          {services.map((service) => (
            <option key={service.name} value={service.name}>
              {service.name} - {service.price}
            </option>
          ))}
        </select>

        {form.service && (
          <select
            style={styles.input}
            value={form.barberName}
            onChange={(e) =>
              setForm({
                ...form,
                barberName: e.target.value,
                date: "",
                time: "",
              })
            }
          >
            <option value="">Kuaför Seç</option>
            {barbers.map((barber) => (
              <option key={barber} value={barber}>
                {barber}
              </option>
            ))}
          </select>
        )}

        {form.barberName && (
          <input
            style={styles.input}
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm({
                ...form,
                date: e.target.value,
                time: "",
              })
            }
          />
        )}

        {form.date && isClosedDay(form.date) && (
          <div style={styles.warningBox}>Bu gün kapalıdır.</div>
        )}

        {form.date && !isClosedDay(form.date) && (
          <>
            <h2 style={styles.sectionTitle}>Saat Seç</h2>

            <div style={styles.hoursGrid}>
              {hours.map((hour) => {
                const busy = isBusy(hour);
                const selected = form.time === hour;
                const outside = isOutsideWorkingHours(hour, form.barberName);

                return (
                  <button
                    key={hour}
                    disabled={busy || outside}
                    onClick={() => setForm({ ...form, time: hour })}
                    style={{
                      ...styles.hourButton,
                      background: outside
                        ? "#555"
                        : busy
                        ? "#c1121f"
                        : selected
                        ? "#d4af37"
                        : "#1faa59",
                      color: selected ? "#111" : "white",
                    }}
                  >
                    {outside ? `${hour} Kapalı` : busy ? `${hour} DOLU` : hour}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <button style={styles.goldButtonFull} onClick={addAppointment} disabled={loading}>
          {loading ? "Randevu Oluşturuluyor..." : "Randevu Oluştur"}
        </button>

        {successMessage && (
          <div style={styles.successBox}>
            ✅ {successMessage}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#050505,#1b1b1b)",
    color: "white",
    padding: "25px",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  hero: {
    textAlign: "center",
    marginBottom: "20px",
  },
  title: {
    fontSize: "46px",
    fontWeight: "900",
    color: "#d4af37",
    letterSpacing: "3px",
    marginBottom: "10px",
    textShadow: "0 0 18px rgba(212,175,55,0.5)",
    textAlign: "center",
  },
  formCard: {
    maxWidth: "500px",
    margin: "auto",
    background: "rgba(17,17,17,0.95)",
    padding: "25px",
    borderRadius: "22px",
    border: "1px solid #333",
    boxShadow: "0 0 35px rgba(212,175,55,0.18)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  input: {
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #555",
    background: "#242424",
    color: "white",
    fontSize: "16px",
    outline: "none",
  },
  miniInput: {
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #555",
    background: "#242424",
    color: "white",
  },
  sectionTitle: {
    color: "#d4af37",
    margin: "10px 0",
    textAlign: "center",
  },
  hoursGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  hourButton: {
    padding: "18px",
    border: "none",
    borderRadius: "14px",
    fontWeight: "bold",
    fontSize: "18px",
    cursor: "pointer",
  },
  goldButtonFull: {
    background: "#d4af37",
    color: "#111",
    padding: "18px",
    border: "none",
    borderRadius: "14px",
    fontWeight: "900",
    fontSize: "18px",
    cursor: "pointer",
    marginTop: "10px",
  },
  card: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "18px",
    boxShadow: "0 0 20px rgba(212,175,55,0.1)",
  },
  adminButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },
  goldButton: {
    flex: 1,
    background: "#d4af37",
    color: "#111",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  redButton: {
    flex: 1,
    background: "#c1121f",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  redSmallButton: {
    background: "#c1121f",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  loginBox: {
    maxWidth: "420px",
    margin: "120px auto",
    background: "#111",
    padding: "30px",
    borderRadius: "20px",
    border: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    fontSize: "18px",
  },
  dashboardGrid: {
    maxWidth: "850px",
    margin: "0 auto 25px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
  },
  statCard: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: "18px",
    padding: "20px",
    color: "#d4af37",
    textAlign: "center",
    boxShadow: "0 0 20px rgba(212,175,55,0.1)",
  },
  panelCard: {
    maxWidth: "850px",
    margin: "0 auto 25px",
    background: "#111",
    border: "1px solid #333",
    borderRadius: "18px",
    padding: "20px",
  },
  workingRow: {
    display: "grid",
    gridTemplateColumns: "1fr 120px 120px",
    gap: "10px",
    alignItems: "center",
    marginBottom: "10px",
  },
  row: {
    display: "flex",
    gap: "10px",
  },
  closedDay: {
    marginTop: "10px",
    background: "#1b1b1b",
    border: "1px solid #333",
    padding: "12px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  warningBox: {
    background: "#c1121f",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "bold",
    textAlign: "center",
  },
  successBox: {
    background: "#1faa59",
    color: "white",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "bold",
    textAlign: "center",
  },
};

export default App;