import io
import os
from datetime import date
from urllib.parse import urlparse

import qrcode
from fpdf import FPDF
from PIL import Image

from app.core.config import settings
from app.models.justificante_model import Justificante, JustificanteTipo
from app.models.user_model import User

MESES_ES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

_HEADER_PATH = "static/images/MEMBRETA_ENCABEZADO.png"
_PIE_PATH = "static/images/MEMBRETE_PIE.png"

_PAGE_W = 215.9
_PAGE_H = 279.4
_MARGIN = 15
_CONTENT_W = _PAGE_W - 2 * _MARGIN


def qr_url_for_token(token: str) -> str:
    if settings.ENVIRONMENT == "production":
        base = "https://ceitm.ddnsking.com"
    else:
        base = "http://localhost:5173"
    return f"{base}/justificante/{token}"


def _img_height(path: str, width_mm: float) -> float:
    try:
        with Image.open(path) as im:
            w_px, h_px = im.size
        return width_mm * h_px / w_px
    except Exception:
        return 30.0


def _qr_stream(url: str) -> io.BytesIO:
    qr = qrcode.QRCode(box_size=10, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def _fecha_larga(fecha: date) -> str:
    return f"{fecha.day} de {MESES_ES[fecha.month - 1]} de {fecha.year}"


def _hora_larga(t) -> str:
    return t.strftime("%H:%M")


class JustificantePDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="letter")
        self.set_auto_page_break(auto=True, margin=42)
        self.set_margins(_MARGIN, 8, _MARGIN)
        self.set_draw_color(0, 0, 0)

    def header(self):
        if self.page_no() == 1:
            self.image(_HEADER_PATH, x=0, y=0, w=_PAGE_W)
            self.set_y(_img_height(_HEADER_PATH, _PAGE_W) + 6)
        else:
            self.set_font("Arial", "I", 8)
            self.set_text_color(120, 120, 120)
            self.cell(0, 10, "CONCEJO ESTUDIANTIL DEL ITM - JUSTIFICANTE", align="C")

    def footer(self):
        self.set_text_color(0, 0, 0)
        pie_h = _img_height(_PIE_PATH, _PAGE_W)
        self.image(_PIE_PATH, x=0, y=_PAGE_H - pie_h, w=_PAGE_W)

    # ------------------------------------------------------------------
    def memo_line(self, text: str, bold: bool = True, size: float = 10.5, y_offset: float = 5.4):
        self.set_font("Arial", "B" if bold else "", size)
        self.cell(0, y_offset, text, align="R")
        self.ln()

    def top_right_block(self, j: Justificante):
        d = j.fecha
        self.memo_line("Morelia, Michoacán")
        self.memo_line(f"{d.day:02d}    {d.month:02d}    {d.year}")
        self.ln(1)
        self.memo_line("ORGANISMO:")
        self.memo_line("CONCEJO ESTUDIANTIL")
        self.memo_line("OFICIO:")
        self.memo_line(j.folio)
        self.memo_line("ASUNTO:")
        self.memo_line("JUSTIFICANTE")
        self.ln(5)

    def saludo(self):
        self.set_font("Arial", "B", 11)
        self.cell(0, 6, "A QUIEN CORRESPONDA", align="C")
        self.ln()
        self.cell(0, 6, "P R E S E N T E.", align="C")
        self.ln(6)

    def paragraph(self, text: str):
        self.set_font("Arial", "", 11)
        self.multi_cell(0, 6.2, text, align="J")
        self.ln(3)

    def body(self, j: Justificante):
        if j.tipo == JustificanteTipo.INDIVIDUAL:
            p = j.participantes[0]
            dia = j.fecha.day
            mes = MESES_ES[j.fecha.month - 1]
            self.paragraph(
                "Por medio de la presente reciba un cordial saludo por parte de todos los miembros del "
                "H. Concejo Estudiantil del Tecnológico Nacional de México campus Morelia."
            )
            self.paragraph(
                f"Me dirijo a usted con el motivo de hacer de su conocimiento que el día {dia} de {mes} "
                f"del año en curso se realizaron actividades por {j.actividad} en el Instituto "
                f"Tecnológico de Morelia, donde el alumno {p['nombre']}, con número de control "
                f"{p['numero_control']} perteneciente a la carrera {p['carrera']}, fue requerido para "
                f"realizar dicho {j.actividad}, por tal motivo le solicito tenga a bien brindar el apoyo "
                f"necesario ya que estuvo presente en un horario de {_hora_larga(j.hora_inicio)} a "
                f"{_hora_larga(j.hora_fin)} hrs y se ausentó de sus actividades escolares, "
                f"comprometiéndose a ponerse al corriente en clase a su regreso."
            )
        else:
            dia = j.fecha.day
            mes = MESES_ES[j.fecha.month - 1]
            self.paragraph(
                "Por medio de la presente reciba un cordial saludo por parte de todos los miembros del "
                "H. Concejo Estudiantil del Instituto Tecnológico de Morelia."
            )
            self.paragraph(
                f"Me dirijo a usted con el motivo de hacer de su conocimiento que el día {dia} de {mes} "
                f"del año en curso se realizó {j.actividad}; donde los alumnos presentados a continuación "
                f"asistieron para participar, por tal motivo le solicito tenga a bien brindar el apoyo "
                f"necesario ya que estuvieron presentes en un horario de {_hora_larga(j.hora_inicio)} a "
                f"{_hora_larga(j.hora_fin)} hrs y se ausentaron de sus actividades escolares, "
                f"comprometiéndose a ponerse al corriente en clase a su regreso."
            )
            self.tabla_participantes(j.participantes)

        self.paragraph(
            "Sin otro particular y esperando poder contar con su apoyo, me despido de usted "
            "agradeciendo de antemano la atención prestada."
        )

    def tabla_participantes(self, participantes):
        self.ln(2)
        col_w = _CONTENT_W / 3.0
        self.set_font("Arial", "B", 10.5)
        self.set_fill_color(220, 220, 220)
        headers = ["Nombre", "Carrera", "No. de control"]
        for i, h in enumerate(headers):
            self.cell(col_w, 8, h, border=1, align="C", fill=True)
        self.ln()
        self.set_font("Arial", "", 10)
        for p in participantes:
            self.cell(col_w, 7, p["nombre"], border=1)
            self.cell(col_w, 7, p["carrera"], border=1)
            self.cell(col_w, 7, p["numero_control"], border=1, align="C")
            self.ln()
        self.ln(4)

    def atentamente(self):
        self.set_font("Arial", "B", 11)
        self.cell(0, 6, "A T E N T A M E N T E", align="C")
        self.ln()
        self.set_font("Arial", "", 10.5)
        self.cell(0, 6, '"Por una educaci\u00f3n integral y el bienestar estudiantil del I.T.M."', align="C")
        self.ln(8)

    def firma_section(self, j: Justificante, aprobador: User, firma_url: str):
        if firma_url:
            fname = os.path.basename(urlparse(firma_url).path)
            path = f"static/uploads/firmas/{fname}"
            if os.path.exists(path):
                try:
                    self.image(path, x=(_PAGE_W - 60) / 2, y=self.get_y(), w=60)
                    self.set_y(self.get_y() + 14)
                except Exception as e:
                    print(f"Error incrustando firma: {e}")

        y_line = self.get_y() + 3
        self.line(_MARGIN + 18, y_line, _PAGE_W - _MARGIN - 18, y_line)
        self.set_y(y_line + 3)
        self.set_font("Arial", "B", 11)
        self.cell(0, 6, f"C. {aprobador.full_name.upper()}", align="C")
        self.ln()

        if j.tipo == JustificanteTipo.INDIVIDUAL:
            carrera = (aprobador.career or "CARRERA").upper()
            subtitle = f"CONCEJAL DE {carrera}"
        else:
            subtitle = "CONCEJAL/A DE CARRERA DEL H. CONCEJO ESTUDIANTIL"
        self.set_font("Arial", "", 10)
        self.cell(0, 6, subtitle, align="C")
        self.ln(6)

    def validation_box(self, j: Justificante, aprobador: User, qr_url: str):
        box_h = 40
        if self.get_y() + box_h + 45 > _PAGE_H - _img_height(_PIE_PATH, _PAGE_W):
            self.add_page()

        y0 = self.get_y()
        self.set_fill_color(245, 245, 245)
        self.rect(_MARGIN, y0, _CONTENT_W, box_h, style="DF")

        qr_w = 30
        qr_x = _MARGIN + _CONTENT_W - qr_w - 6
        try:
            self.image(_qr_stream(qr_url), x=qr_x, y=y0 + 5, w=qr_w)
        except Exception as e:
            print(f"Error generando QR: {e}")

        text_x = _MARGIN + 6
        text_w = qr_x - 6 - text_x
        self.set_xy(text_x, y0 + 5)
        self.set_font("Arial", "B", 10)
        self.cell(text_w, 6, "VALIDACI\u00d3N DIGITAL", align="L")
        self.ln()
        self.set_font("Arial", "", 9.5)
        lineas = [
            f"Sello: {j.sello_digital}",
            f"Aprobado por: {aprobador.full_name}",
            f"Fecha y hora de aprobaci\u00f3n: {_fecha_larga(j.approved_at.date())} a las "
            f"{j.approved_at.strftime('%H:%M')} hrs",
        ]
        for linea in lineas:
            self.set_x(text_x)
            self.multi_cell(text_w, 5.5, linea, align="L")

        self.set_y(y0 + box_h + 5)
        self.set_font("Arial", "", 10)
        self.cell(0, 6, "Ccp. Secretaría CEITM", align="L")
        self.ln(2)


def generate_justificante_pdf(j: Justificante, aprobador: User, firma_url: str, qr_url: str) -> bytes:
    pdf = JustificantePDF()
    pdf.alias_nb_pages()
    pdf.add_page()

    pdf.top_right_block(j)
    pdf.saludo()
    pdf.body(j)
    pdf.atentamente()
    pdf.firma_section(j, aprobador, firma_url)
    pdf.validation_box(j, aprobador, qr_url)

    return pdf.output()