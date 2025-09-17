import qrcode
import base64
from io import BytesIO

def generate_qr_code(data: str) -> str:
    """Generate a QR code as a base64 PNG string from the given data."""
    img = qrcode.make(data)
    buf = BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"
