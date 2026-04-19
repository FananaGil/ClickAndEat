"""
Utility functions for CLICK&EAT project.
"""

import math
import uuid
from decimal import Decimal
from django.conf import settings


def generate_unique_number(prefix=''):
    """
    Generate a unique number with optional prefix.
    """
    unique_id = uuid.uuid4().hex[:8].upper()
    return f'{prefix}{unique_id}'


def generate_pedido_numero():
    """
    Generate a unique pedido number.
    """
    return generate_unique_number('PED')


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the distance between two points using the Haversine formula.
    Returns distance in kilometers.
    """
    R = 6371  # Earth's radius in kilometers

    lat1_rad = math.radians(float(lat1))
    lat2_rad = math.radians(float(lat2))
    delta_lat = math.radians(float(lat2) - float(lat1))
    delta_lon = math.radians(float(lon2) - float(lon1))

    a = math.sin(delta_lat / 2) ** 2 + \
        math.cos(lat1_rad) * math.cos(lat2_rad) * \
        math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance


def is_within_radius(lat1, lon1, lat2, lon2, radius_km):
    """
    Check if a point is within a given radius of another point.
    """
    distance = calculate_distance(lat1, lon1, lat2, lon2)
    return distance <= radius_km


def validate_file_extension(filename, allowed_extensions):
    """
    Validate file extension.
    """
    ext = filename.split('.')[-1].lower()
    return ext in allowed_extensions


def validate_file_size(file, max_size_bytes):
    """
    Validate file size.
    """
    return file.size <= max_size_bytes


def calculate_delivery_cost(distance, base_cost=0, cost_per_km=0):
    """
    Calculate delivery cost based on distance.
    """
    return Decimal(str(base_cost)) + (Decimal(str(distance)) * Decimal(str(cost_per_km)))


def format_phone(phone):
    """
    Format phone number to standard format.
    """
    # Remove all non-digit characters
    digits = ''.join(filter(str.isdigit, phone))

    # Add country code if not present
    if len(digits) == 10:
        digits = '58' + digits

    return digits


def generate_slug(text):
    """
    Generate a URL-friendly slug from text.
    """
    import unicodedata
    import re

    # Convert to lowercase
    text = text.lower()

    # Remove accents
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')

    # Replace spaces with hyphens
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)

    return text.strip('-')


class FileUploadValidator:
    """
    Validator for file uploads.
    """
    ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

    @classmethod
    def validate_image(cls, file):
        """
        Validate an image file.
        """
        if not validate_file_extension(file.name, cls.ALLOWED_IMAGE_EXTENSIONS):
            return False, f'Extensión de archivo no permitida. Permitidas: {", ".join(cls.ALLOWED_IMAGE_EXTENSIONS)}'

        if not validate_file_size(file, cls.MAX_FILE_SIZE):
            return False, f'El archivo excede el tamaño máximo permitido ({cls.MAX_FILE_SIZE // (1024*1024)}MB)'

        return True, None

    @classmethod
    def validate_document(cls, file):
        """
        Validate a document file.
        """
        if not validate_file_extension(file.name, cls.ALLOWED_DOCUMENT_EXTENSIONS):
            return False, f'Extensión de archivo no permitida. Permitidas: {", ".join(cls.ALLOWED_DOCUMENT_EXTENSIONS)}'

        if not validate_file_size(file, cls.MAX_FILE_SIZE):
            return False, f'El archivo excede el tamaño máximo permitido ({cls.MAX_FILE_SIZE // (1024*1024)}MB)'

        return True, None


def get_client_ip(request):
    """
    Get client IP address from request.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
