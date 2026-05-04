document.addEventListener('DOMContentLoaded', () => {
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxpp1BpleEEtfXMGX3tfucmFN_OEpQa25xXFXo_pxVlMNEwsvUB7VtdzP5AfL2lND7C/exec";
    let citasOcupadas = [], currentMonth = new Date();

    const renderCalendar = () => {
        const grid = document.getElementById('calendarGrid');
        const monthDisplay = document.getElementById('monthDisplay');
        grid.innerHTML = '';
        const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
        monthDisplay.textContent = new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' }).format(currentMonth);

        const first = new Date(y, m, 1).getDay();
        const offset = first === 0 ? 6 : first - 1;
        const hoy = new Date(); hoy.setHours(0,0,0,0);

        for (let i = 0; i < offset; i++) grid.appendChild(document.createElement('div'));

        for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const diaEl = document.createElement('div');
            diaEl.className = 'calendar-day-mini';
            const diaFecha = new Date(y, m, d);
            if (diaFecha < hoy) diaEl.classList.add('past');
            if (citasOcupadas.some(c => c.fecha === dateStr)) diaEl.classList.add('has-bookings');
            diaEl.innerHTML = `<span>${d}</span>`;
            if (diaFecha >= hoy) diaEl.onclick = () => showDetails(dateStr, diaFecha);
            grid.appendChild(diaEl);
        }
    };

    const fetchBookings = async () => {
        const res = await fetch(WEB_APP_URL);
        const data = await res.json();
        citasOcupadas = data.bookings;
        renderCalendar();
    };

    const showDetails = (dateStr, dateObj) => {
        const hList = document.getElementById('hourList');
        document.getElementById('dayDetails').classList.remove('hidden');
        hList.innerHTML = '';
        const ds = dateObj.getUTCDay();
        let sH = 17, eH = 23; if (ds === 6) sH = 15; if (ds === 0) { sH = 10; eH = 16; } 
        const ocup = citasOcupadas.filter(c => c.fecha === dateStr);

        for (let h = sH; h < eH; h++) {
            const reserva = ocup.find(c => h >= c.horaInicio && h < (c.horaInicio + c.duracion));
            const slot = document.createElement('div');
            slot.className = `hour-slot-compact ${reserva ? 'busy' : 'free'}`;
            if(reserva) {
                slot.innerHTML = `<span>${h}:00</span> <small class="band-label">${reserva.nombre}</small>`;
            } else {
                slot.innerHTML = `<span>${h}:00</span> <button class="btn-book-micro" onclick="window.location.href='index.html?fecha=${dateStr}&hora=${h}:00'">Reservar</button>`;
            }
            hList.appendChild(slot);
        }
    };

    document.getElementById('prevMonth').onclick = () => { currentMonth.setMonth(currentMonth.getMonth() - 1); renderCalendar(); };
    document.getElementById('nextMonth').onclick = () => { currentMonth.setMonth(currentMonth.getMonth() + 1); renderCalendar(); };
    renderCalendar(); fetchBookings();
});