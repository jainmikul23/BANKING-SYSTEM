from config import constants

def brand_constants(request):
    """Expose central banking brand constants to all templates."""
    return {
        'CARD_NAME': constants.CARD_NAME,
        'BANK_NAME': constants.BANK_NAME,
        'BANK_SHORT_NAME': constants.BANK_SHORT_NAME,
        'BANK_MONOGRAM': constants.BANK_MONOGRAM,
        'SUPPORT_EMAIL': constants.SUPPORT_EMAIL,
        'SECURITY_EMAIL': constants.SECURITY_EMAIL,
    }
