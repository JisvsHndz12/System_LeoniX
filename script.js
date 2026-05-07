document.addEventListener('DOMContentLoaded', () => {
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxpp1BpleEEtfXMGX3tfucmFN_OEpQa25xXFXo_pxVlMNEwsvUB7VtdzP5AfL2lND7C/exec";
    let citasOcupadas = [], tasas = { usd: 0, eur: 0 };
    document.getElementById('fecha').min = new Date().toISOString().split('T')[0];

    const bankInfo = {
        Transferencia: `<strong>MERCANTIL</strong><br>0105 0289 6312 89101086<br>Jesus Hernandez<br>C.I.: V-20897393`,
        PagoMovil: `<strong>PAGO MÓVIL</strong><br>Mercantil-0105<br>0424-3525332<br>C.I.: V-20897393`
    };

    const elements = {
        categoria: document.getElementById('categoriaServicio'),
        fecha: document.getElementById('fecha'),
        hora: document.getElementById('hora'),
        duracion: document.getElementById('duracionSesion'),
        availableLabel: document.getElementById('availableLabel'),
        abono: document.getElementById('porcentajeAbono'),
        viaPago: document.getElementById('viaPago'),
        btn: document.getElementById('btnEnviar'),
        fileInput: document.getElementById('comprobante'),
        pkgContainer: document.getElementById('packageContainer')
    };

    fetch(WEB_APP_URL).then(res => res.json()).then(data => {
        tasas = data.tasas; citasOcupadas = data.bookings;
        document.getElementById('bcvRates').textContent = `BCV: $${tasas.usd} | €${tasas.eur}`;
        elements.hora.disabled = false;
        const params = new URLSearchParams(window.location.search);
        if(params.get('fecha')) { 
            elements.fecha.value = params.get('fecha'); 
            elements.fecha.dispatchEvent(new Event('change')); 
            if(params.get('hora')) setTimeout(() => { elements.hora.value = params.get('hora'); elements.hora.dispatchEvent(new Event('change')); }, 700);
        }
    });

    // LÓGICA DE PAQUETES
    document.getElementById('btnAddPackage').addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'package-entry';
        div.innerHTML = `<select class="prod-pkg-select"><option value="Estándar" data-precio="150">Estándar (€150)</option><option value="Poeta" data-precio="200">El Poeta (€200)</option><option value="Deluxe" data-precio="250">Deluxe (€250)</option></select><button type="button" class="btn-remove-pkg">×</button>`;
        elements.pkgContainer.appendChild(div);
        calcular();
    });

    elements.pkgContainer.addEventListener('click', e => { if(e.target.classList.contains('btn-remove-pkg')) { e.target.closest('.package-entry').remove(); calcular(); } });

    const calcular = () => {
        let usd = 0, eur = 0; const hrs = parseInt(elements.duracion.value) || 1; const cat = elements.categoria.value;
        if (['Ensayo', 'Grabacion'].includes(cat)) {
            usd = hrs * (cat === 'Ensayo' ? 5 : 0); eur = (cat === 'Grabacion' ? hrs * 15 : 0);
            document.querySelectorAll('.inst-qty').forEach(iq => usd += (iq.value * 5));
            document.querySelectorAll('.extra-calc:checked').forEach(el => { if(el.dataset.curr === 'EUR') eur += +el.dataset.precio; else usd += el.id === 'checkTecnico' ? (hrs * 5) : +el.dataset.precio; });
        } else if (cat === 'Edicion') eur = hrs * 10;
        else if (cat === 'Produccion') { document.querySelectorAll('.prod-pkg-select').forEach(sel => eur += +sel.selectedOptions[0].dataset.precio); }
        const tBS = (usd * tasas.usd) + (eur * tasas.eur);
        const aBS = elements.abono.value === '50%' ? tBS / 2 : tBS;
        document.getElementById('totalUSD_EUR').textContent = `Total: $${usd} / €${eur}`;
        document.getElementById('totalBS').textContent = `${tBS.toLocaleString('es-VE', {minimumFractionDigits: 2})} BS`;
        document.getElementById('paymentNote').textContent = `A PAGAR AHORA: ${aBS.toLocaleString('es-VE', {minimumFractionDigits: 2})} BS`;
        return { totalBS: tBS, abonoBS: aBS };
    };

    elements.categoria.addEventListener('change', () => {
        const s = elements.categoria.value; const isP = s === 'Produccion';
        document.getElementById('sectionInstrumentos').classList.toggle('hidden', s !== 'Ensayo' && s !== 'Grabacion');
        document.getElementById('sectionSala').classList.toggle('hidden', s !== 'Ensayo' && s !== 'Grabacion');
        document.getElementById('sectionProduccion').classList.toggle('hidden', !isP);
        document.getElementById('containerHora').classList.toggle('hidden', isP);
        document.getElementById('containerDuracion').classList.toggle('hidden', isP);
        if(isP) { elements.hora.required = false; elements.hora.value = "N/A"; elements.availableLabel.textContent = ""; } else { elements.hora.required = true; }
        calcular();
    });

    elements.fecha.addEventListener('change', () => {
        const f = elements.fecha.value; const hoy = new Date(); const ds = new Date(f + "T00:00:00").getUTCDay();
        let sH = 17, eH = 23; if (ds === 6) sH = 15; if (ds === 0) { sH = 10; eH = 16; }
        const ocup = citasOcupadas.filter(c => c.fecha === f);
        elements.hora.innerHTML = '<option value="">Seleccione Hora...</option>';
        
        let found = false;
        for (let h = sH; h < eH; h++) {
            if (f === hoy.toISOString().split('T')[0] && h <= hoy.getHours()) continue;
            let gap = eH - h;
            const prox = ocup.filter(c => c.horaInicio > h).sort((a,b) => a.horaInicio - b.horaInicio)[0];
            if (prox) gap = Math.min(gap, prox.horaInicio - h);
            if (!ocup.some(c => h >= c.horaInicio && h < (c.horaInicio + c.duracion)) && gap >= 1) {
                const opt = document.createElement('option');
                opt.value = `${h}:00`; opt.textContent = `${h}:00 (Disponible)`; opt.style.color = "#00ff88";
                opt.dataset.gap = gap;
                elements.hora.appendChild(opt);
                found = true;
            }
        }

        // CORRECCIÓN QUIRÚRGICA: Muestra error si no hay horas[cite: 7]
        if (!found) {
            elements.availableLabel.textContent = "SIN DISPONIBILIDAD PARA ESTA FECHA";
            elements.availableLabel.className = "error-text-small";
        } else {
            elements.availableLabel.textContent = "SELECCIONE UNA HORA PARA VER EL BLOQUE";
            elements.availableLabel.className = "info-text-small";
        }
    });

    elements.hora.addEventListener('change', () => {
        const opt = elements.hora.selectedOptions[0];
        if(opt && opt.dataset.gap) {
            const gap = opt.dataset.gap;
            elements.duracion.max = gap;
            elements.duracion.value = Math.min(gap, 2);
            elements.availableLabel.textContent = `BLOQUE DISPONIBLE: ${gap} HORA(S)`;
            elements.availableLabel.className = "success-text-small"; // Color Verde
        } else if (elements.hora.value === "") {
            elements.availableLabel.textContent = "SELECCIONE UNA HORA PARA VER EL BLOQUE";
            elements.availableLabel.className = "info-text-small";
        }
        calcular();
    });

    elements.viaPago.addEventListener('change', () => {
        document.getElementById('pagoInfo').innerHTML = bankInfo[elements.viaPago.value] || "";
        document.getElementById('pagoInfo').classList.toggle('hidden', !elements.viaPago.value);
    });

    elements.fileInput.addEventListener('change', () => {
        document.getElementById('fileText').textContent = "✔ Recibido";
        elements.btn.disabled = false; elements.btn.classList.add('active');
    });

    document.getElementById('bookingForm').addEventListener('submit', async e => {
        e.preventDefault(); elements.btn.disabled = true; elements.btn.textContent = "Agendando...";
        const prec = calcular(); const reader = new FileReader();
        reader.readAsDataURL(elements.fileInput.files[0]);
        reader.onload = async () => {
            const payload = {
                nombre: document.getElementById('nombre').value,
                servicio: elements.categoria.value,
                fecha: document.getElementById('fecha').value,
                hora: elements.hora.value,
                duracion: elements.duracion.value,
                pagoTotal: document.getElementById('totalUSD_EUR').textContent,
                montoBS: `${prec.totalBS.toFixed(2)} BS`,
                porcentajePago: elements.abono.value,
                archivo: reader.result.split(',')[1],
                nombreArchivo: `LEONIX_${Date.now()}.png`
            };
            await fetch(WEB_APP_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });

                        // ... (dentro de tu función después del fetch)

            let msj = `*RESERVA LEONIX SOUND*%0A*Cliente:* ${payload.nombre}%0A*Fecha:* ${payload.fecha} | ${payload.hora}%0A*Monto Total:* ${prec.totalBS.toLocaleString('es-VE')} BS%0A`;
            if (payload.porcentajePago === '50%') {
                msj += `*Abono (50%):* ${prec.abonoBS.toLocaleString('es-VE')} BS%0A*Restante (50%):* ${prec.abonoBS.toLocaleString('es-VE')} BS (Pendiente el día de la pauta)%0A%0A_Comprobante guardado en la nube._`;
            } else {
                msj += `*Estado:* PAGADO EN SU TOTALIDAD (100%)%0A*Monto Cancelado:* ${prec.totalBS.toLocaleString('es-VE')} BS%0A%0A_Comprobante guardado en la nube._`;
            }

            // --- CAMBIO CLAVE AQUÍ ---
            const urlWhatsApp = `https://wa.me/584167071648?text=${msj}`;

            // 1. Usamos location.href en lugar de window.open (Mucho más estable en APK)
            window.location.href = urlWhatsApp;

            // 2. IMPORTANTE: Eliminamos el location.reload() inmediato. 
            // Si necesitas limpiar el formulario, es mejor hacerlo manualmente o 
            // esperar unos segundos antes de recargar.
            setTimeout(() => {
                // Esto solo ocurrirá si el usuario regresa a la app después de enviar el mensaje
                console.log("Formulario enviado con éxito");
                // location.reload(); // Solo descomenta si es estrictamente necesario, pero suele dar problemas en APK
            }, 3000);
        };
    });
    document.addEventListener('input', calcular);
});
