import io
import httpx
from fpdf import FPDF
from pypdf import PdfReader, PdfWriter
from PIL import Image
from datetime import datetime
from app.models.scholarship_model import ScholarshipApplication


class PDFGenerator(FPDF):
    def header(self):
        # --- HEADER INSTITUCIONAL ---
        # Ajusta las rutas si tienes los archivos de imagen en backend/static/images/
        # self.image("static/images/logo-tecnm.png", 10, 10, 30)
        self.image("static/images/logo-consejo.png", 170, 10, 30)

        self.set_y(15)
        self.set_font('Arial', 'B', 14)
        self.cell(0, 10, 'INSTITUTO TECNOLÓGICO DE MORELIA', 0, 1, 'C')
        self.set_font('Arial', 'B', 12)
        self.cell(0, 6, 'CONSEJO ESTUDIANTIL (CEITM)', 0, 1, 'C')
        self.ln(5)
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, 'SOLICITUD DE BECA', 0, 1, 'C')

        # Línea separadora
        self.set_draw_color(100, 100, 100)
        self.line(10, self.get_y() + 2, 200, self.get_y() + 2)
        self.ln(10)

    def footer(self):
        self.set_y(-20)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10,
                  f'Página {self.page_no()}/{{nb}} - Documento generado digitalmente por la plataforma del CEITM el {datetime.now().strftime("%d/%m/%Y %H:%M")}',
                  0, 0, 'C')

    def section_title(self, title):
        """Helper para títulos de sección"""
        self.set_font('Arial', 'B', 11)
        self.set_fill_color(230, 230, 230)  # Gris claro
        self.set_text_color(0, 0, 0)
        self.cell(0, 8, title.upper(), 1, 1, 'L', 1)
        self.ln(2)

    def data_row(self, label, value, w_label=40, w_value=60, newline=False):
        """Helper para filas de datos: Etiqueta en negrita, Valor normal"""
        self.set_font('Arial', 'B', 10)
        self.cell(w_label, 7, label, 0)
        self.set_font('Arial', '', 10)
        # Truncar texto si es muy largo para la celda
        val_str = str(value)
        if len(val_str) > 45 and w_value < 100:
            val_str = val_str[:42] + "..."
        self.cell(w_value, 7, val_str, 0, 1 if newline else 0)


async def download_file(url: str) -> io.BytesIO:
    """Descarga un archivo (imagen o PDF) de una URL de forma asíncrona."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=15.0)
        resp.raise_for_status()
        return io.BytesIO(resp.content)


async def generate_scholarship_pdf(app: ScholarshipApplication) -> bytes:
    """
    Genera el PDF unificado con diseño profesional.
    """
    pdf = PDFGenerator()
    pdf.set_auto_page_break(auto=True, margin=25)
    pdf.alias_nb_pages()
    pdf.add_page()

    # --- SECCIÓN 1: DATOS GENERALES Y FOTO (Diseño 2 Columnas) ---
    pdf.section_title('1. Datos Generales del Solicitante')

    # Guardamos posición Y inicial para alinear la foto
    y_start = pdf.get_y()

    # COLUMNA IZQUIERDA (Texto) - Ancho aprox 140mm
    pdf.set_left_margin(10)
    pdf.data_row('Nombre Completo:', app.full_name.upper(), w_label=40, w_value=100, newline=True)
    pdf.data_row('No. de Control:', app.control_number, w_label=40, w_value=40)
    pdf.data_row('Teléfono:', app.phone_number, w_label=25, w_value=40, newline=True)
    pdf.data_row('Carrera:', app.career, w_label=40, w_value=100, newline=True)
    pdf.data_row('Semestre:', app.semester, w_label=40, w_value=40)
    pdf.data_row('Correo Inst:', app.email, w_label=25, w_value=60, newline=True)

    # Si es CLE
    if app.cle_control_number:
        pdf.data_row('Control CLE:', app.cle_control_number, w_label=30, w_value=30)
        pdf.data_row('Nivel:', app.level_to_enter, w_label=15, w_value=30, newline=True)

    # COLUMNA DERECHA (Foto) - Posición absoluta
    # Coordenadas para el recuadro de la foto (ajustadas para que no tape texto)
    photo_x = 165
    photo_y = y_start + 2
    photo_w = 35
    photo_h = 45

    # Dibujar marco de foto
    pdf.set_draw_color(180, 180, 180)
    pdf.rect(photo_x, photo_y, photo_w, photo_h)

    if app.student_photo:
        try:
            photo_stream = await download_file(app.student_photo)
            # Insertar imagen dentro del marco
            pdf.image(photo_stream, x=photo_x + 1, y=photo_y + 1, w=photo_w - 2, h=photo_h - 2)
        except Exception as e:
            print(f"Error descargando foto: {e}")
            pdf.set_font('Arial', 'I', 8)
            pdf.set_xy(photo_x, photo_y + 20)
            pdf.multi_cell(photo_w, 5, "Foto no disponible", 0, 'C')

    # Asegurar que el cursor baje después de la sección de foto
    pdf.set_y(max(pdf.get_y(), photo_y + photo_h) + 8)

    # --- SECCIÓN 2: SITUACIÓN ACADÉMICA ---
    pdf.section_title('2. Situación Académica')
    pdf.data_row('Promedio Aritmético:', str(app.arithmetic_average), w_label=45, w_value=30)
    pdf.data_row('Promedio Certificado:', str(app.certified_average), w_label=45, w_value=30, newline=True)
    pdf.ln(3)

    # --- SECCIÓN 3: ESTUDIO SOCIOECONÓMICO ---
    pdf.section_title('3. Estudio Socioeconómico')

    # Direcciones usando MultiCell para que no se salgan del margen
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(40, 7, 'Domicilio Actual:', 0, 1)
    pdf.set_font('Arial', '', 10)
    pdf.multi_cell(0, 6, app.address, border=1)
    pdf.ln(2)

    if app.origin_address and app.origin_address not in ['N/A', '']:
        pdf.set_font('Arial', 'B', 10)
        pdf.cell(40, 7, 'Domicilio de Origen:', 0, 1)
        pdf.set_font('Arial', '', 10)
        pdf.multi_cell(0, 6, app.origin_address, border=1)
        pdf.ln(4)

    # Datos Económicos (Aquí arreglamos la superposición)
    pdf.data_row('Dependencia Económica:', app.economic_dependence, w_label=50, w_value=100, newline=True)
    pdf.ln(2)  # Espacio extra

    pdf.data_row('Ingreso Familiar Mensual:', f"${app.family_income:,.2f}", w_label=55, w_value=35)
    pdf.data_row('Ingreso Per Cápita:', f"${app.income_per_capita:,.2f}", w_label=45, w_value=35, newline=True)
    pdf.data_row('No. de Dependientes:', str(app.dependents_count), w_label=55, w_value=20, newline=True)
    pdf.ln(5)

    # --- SECCIÓN 4: MOTIVOS Y ANTECEDENTES ---
    pdf.section_title('4. Carta de Motivos y Antecedentes')

    pdf.set_font('Arial', 'B', 10)
    pdf.cell(0, 7, 'Exposición de Motivos:', 0, 1)
    pdf.set_font('Arial', '', 10)
    # MultiCell para el texto largo de motivos
    pdf.multi_cell(0, 6, app.motivos, border='LRB', fill=False)
    pdf.ln(5)

    if app.previous_scholarship and app.previous_scholarship != "No":
        pdf.set_fill_color(245, 245, 220)  # Beige claro para resaltar
        pdf.set_font('Arial', 'B', 10)
        pdf.cell(50, 8, 'Antecedentes de Beca:', 1, 0, 'L', 1)
        pdf.set_font('Arial', '', 10)
        texto_antecedente = f"{app.previous_scholarship}"
        if app.release_folio:
            texto_antecedente += f" (Folio de Liberación: {app.release_folio})"
        pdf.cell(0, 8, texto_antecedente, 1, 1, 'L', 0)
        pdf.ln(5)

    # --- ÁREA DE FIRMAS ---
    pdf.ln(25)  # Espacio grande antes de firmas
    y_firmas = pdf.get_y()

    # Línea Alumno
    pdf.line(25, y_firmas, 95, y_firmas)
    pdf.set_font('Arial', 'B', 9)
    pdf.text(45, y_firmas + 5, "Firma del Solicitante")
    pdf.set_font('Arial', '', 8)
    pdf.text(40, y_firmas + 10, app.control_number)

    # Línea CEITM
    pdf.line(115, y_firmas, 185, y_firmas)
    pdf.set_font('Arial', 'B', 9)
    pdf.text(135, y_firmas + 5, "Sello de Recepción CEITM")

    # --- FUSIÓN DE EVIDENCIAS ---
    # 1. Obtener el PDF de la solicitud en memoria
    solicitud_pdf_bytes = pdf.output()

    # 2. Iniciar el mezclador de PDFs
    merger = PdfWriter()
    merger.append(io.BytesIO(solicitud_pdf_bytes))

    # Lista de documentos a anexar
    docs_to_merge = [
        ("INE / Identificación", app.doc_ine),
        ("Kardex Académico", app.doc_kardex),
        ("Comprobante de Ingresos", app.doc_income),
        ("Comprobante de Domicilio", app.doc_address),
        ("Documento Extra", app.doc_extra)
    ]

    print("Iniciando fusión de evidencias...")
    for titulo, url in docs_to_merge:
        if url:
            try:
                # Descargar el archivo (imagen o pdf)
                file_stream = await download_file(url)

                try:
                    # Intento 1: ¿Es un PDF nativo?
                    reader = PdfReader(file_stream)
                    merger.append(reader)
                    print(f"✅ {titulo} anexado como PDF.")
                except:
                    # Intento 2: Si falla, asumir que es IMAGEN y convertir a PDF
                    print(f"🔄 Convirtiendo imagen {titulo} a PDF...")
                    file_stream.seek(0)  # Resetear puntero del stream
                    img = Image.open(file_stream)

                    # Convertir RGBA a RGB si es necesario (ej. PNG transparentes)
                    if img.mode == 'RGBA': img = img.convert('RGB')

                    # Crear PDF en memoria desde la imagen
                    img_pdf_bytes = io.BytesIO()
                    img.save(img_pdf_bytes, format='PDF', resolution=100.0)
                    img_pdf_bytes.seek(0)

                    merger.append(PdfReader(img_pdf_bytes))
                    print(f"✅ Imagen {titulo} convertida y anexada.")

            except Exception as e:
                # Si falla una evidencia, no rompemos todo, solo la omitimos y logueamos
                print(f"❌ Error crítico anexando {titulo} ({url}): {e}")

    # 3. Generar el PDF final unificado
    final_output_stream = io.BytesIO()
    merger.write(final_output_stream)
    return final_output_stream.getvalue()