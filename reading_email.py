"""Send a visitor's completed tarot reading to the configured reader."""

from email.message import EmailMessage
import json
import os
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class MailConfigurationError(ValueError):
    pass


def valid_email(value):
    if not isinstance(value, str) or len(value) > 254 or not value.isascii():
        return False
    return bool(re.fullmatch(
        r"[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*"
        r"@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?"
        r"(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+", value
    ))


def settings_from_env():
    settings = {
        'api_key': os.environ.get('BREVO_API_KEY', '').strip(),
        'sender': os.environ.get('MAIL_FROM', '').strip(),
        'recipient': os.environ.get('READINGS_EMAIL', '').strip(),
    }
    if not settings['api_key'] or any(c.isspace() for c in settings['api_key']):
        raise MailConfigurationError('BREVO_API_KEY is missing or invalid')
    if not valid_email(settings['sender']) or not valid_email(settings['recipient']):
        raise MailConfigurationError('MAIL_FROM and READINGS_EMAIL must be valid email addresses')
    return settings


def build_message(settings, *, visitor_email, question, spread, cards, request_id):
    if not valid_email(visitor_email):
        raise ValueError('Invalid visitor email')
    message = EmailMessage()
    message['Subject'] = f"Arcana reading — {spread['name']} [{request_id}]"
    message['From'] = settings['sender']
    message['To'] = settings['recipient']
    message['Reply-To'] = visitor_email
    lines = [
        'A visitor sent you their completed tarot reading.',
        'Reply to this email to contact the visitor.',
        '',
        f'Reference: {request_id}',
        f'Visitor email: {visitor_email}',
        f"Spread: {spread['name']}",
        f"Question: {question or 'General reading'}",
        '',
        'CARDS',
    ]
    for index, card in enumerate(cards, 1):
        orientation = 'Reversed' if card['reversed'] else 'Upright'
        meaning = card['reversed_meaning'] if card['reversed'] else card['upright_meaning']
        lines.extend([
            f"{index}. {card['position']}: {card['name']} ({orientation})",
            f"   {card['position_meaning']}",
            f"   {meaning}",
            f"   In this reading: {card.get('narrative', '')}",
        ])
    message.set_content('\n'.join(lines))
    return message


def send_with_brevo(settings, message):
    payload = {
        'sender': {'name': 'Arcana', 'email': settings['sender']},
        'to': [{'email': settings['recipient']}],
        'replyTo': {'email': str(message['Reply-To'])},
        'subject': str(message['Subject']),
        'textContent': message.get_content(),
    }
    request = Request(
        'https://api.brevo.com/v3/smtp/email',
        data=json.dumps(payload).encode('utf-8'),
        headers={'api-key': settings['api_key'], 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urlopen(request, timeout=20) as response:
            result = json.loads(response.read(65536))
            if response.status != 201 or not result.get('messageId'):
                raise OSError('Email provider did not confirm delivery')
    except HTTPError as error:
        error.close()
        raise OSError('Email provider rejected the request') from None
    except (URLError, json.JSONDecodeError):
        raise OSError('Email provider could not be reached') from None
