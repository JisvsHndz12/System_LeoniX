import streamlit as st
import pandas as pd
import google.generativeai as genai
import random
import os
from datetime import datetime

# --- IDENTIDAD CORPORATIVA LEONIX SOUND ---
ST_COLORS = {
    "background": "#090d0e",  # Negro de fondo
    "text": "#e3cfb4",        # Beige en letras
    "primary": "#d0741f",     # Naranja
    "secondary": "#353158",   # Morado
    "accent": "#b8b90d"       # Verde de los ojos
}

# --- CONFIGURACIÓN DE IA ---
def inicializar_gemini():
    api_key = random.choice(st.secrets["GOOGLE_API_KEYS"])
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')

# --- LÓGICA DE DATOS (PANDAS VECTORIZADO) ---
def cargar_datos(filename, columnas):
    if os.path.exists(filename):
        return pd.read_csv(filename)
    return pd.DataFrame(columns=columnas)

def guardar_datos_local(df, filename):
    df.to_csv(filename, index=False)

# --- CONFIGURACIÓN DE PÁGINA Y CSS ---
st.set_page_config(page_title="LeoniX Sound Studio", layout="wide")

st.markdown(f"""
    <style>
    /* Aplicación de colores corporativos */
    .stApp {{ background-color: {ST_COLORS['background']}; color: {ST_COLORS['text']}; }}
    
    /* Títulos y textos generales */
    h1, h2, h3, p, label {{ color: {ST_COLORS['text']} !important; }}
    
    /* Estilos de botones */
    .stButton>button {{ 
        background-color: {ST_COLORS['primary']}; 
        color: {ST_COLORS['background']}; 
        border: 2px solid {ST_COLORS['secondary']}; 
        border-radius: 8px; 
        font-weight: bold;
        width: 100%;
    }}
    .stButton>button:hover {{ 
        background-color: {ST_COLORS['secondary']}; 
        color: {ST_COLORS['text']}; 
        border: 2px solid {ST_COLORS['accent']}; 
    }}
    
    /* Inputs y Text Areas */
    .stTextInput>div>div>input, .stTextArea>div>textarea {{
        background-color: {ST_COLORS['secondary']};
        color: {ST_COLORS['text']};
        border: 1px solid {ST_COLORS['primary']};
    }}
    </style>
""", unsafe_allow_html=True)

# --- INTERFAZ ---
with st.sidebar:
    if os.path.exists("assets/logo.png"):
        st.image("assets/logo.png")
    st.markdown(f"<h2 style='text-align: center; color: {ST_COLORS['primary']} !important;'>LeoniX Sound</h2>", unsafe_allow_html=True)
    opcion = st.radio("Módulos:", ["Agendar Ensayo", "Producción Musical", "Admin"], label_visibility="hidden")

if opcion == "Agendar Ensayo":
    st.header("Reserva de Sala de Ensayo")
    with st.form("form_ensayo", clear_on_submit=True):
        col1, col2 = st.columns(2)
        with col1:
            banda = st.text_input("Banda / Proyecto")
            fecha = st.date_input("Fecha")
        with col2:
            horas = st.number_input("Horas ($5/hr - Min 2hrs)", min_value=2, max_value=12)
            pago = st.file_uploader("Adjuntar Pago", type=['png', 'jpg', 'pdf'])
        
        if st.form_submit_button("Confirmar Reserva"):
            if banda and pago:
                df = cargar_datos("database_ensayos.csv", ["Banda", "Fecha", "Horas", "Estado"])
                nuevo_registro = pd.DataFrame([{"Banda": banda, "Fecha": str(fecha), "Horas": horas, "Estado": "Pendiente"}])
                df = pd.concat([df, nuevo_registro], ignore_index=True)
                guardar_datos_local(df, "database_ensayos.csv")
                st.success("¡Reserva guardada localmente! (Pendiente sincronización a Drive)")
            else:
                st.error("Campos incompletos.")

elif opcion == "Producción Musical":
    st.header("Servicios de Producción")
    st.write("Paquete Estándar: Desde €150 | Paquete El Poeta: Desde €200 | Deluxe: Consultar")
    
    st.subheader("Consultor IA de Producción")
    consulta = st.text_area("Describe tu proyecto (Género, referencias, instrumentación):")
    if st.button("Analizar Proyecto"):
        if consulta:
            with st.spinner("Analizando con Gemini..."):
                model = inicializar_gemini()
                respuesta = model.generate_content(f"Actúa como productor musical de LeoniX Sound. Responde a esto con base en los precios del estudio: {consulta}")
                st.info(respuesta.text)

elif opcion == "Admin":
    st.header("Panel de Control")
    df_view = cargar_datos("database_ensayos.csv", ["Banda", "Fecha", "Horas", "Estado"])
    st.dataframe(df_view, use_container_width=True)