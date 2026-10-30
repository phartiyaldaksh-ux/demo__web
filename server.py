import json
import mimetypes
import os
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE_VENUES = [
    {
        'id': 1,
        'name': 'Sky Turf Arena',
        'sport': 'Football',
        'location': 'Koramangala',
        'rating': 4.8,
        'price': 480,
        'badge': 'Featured'
    },
    {
        'id': 2,
        'name': 'Green Park Cricket',
        'sport': 'Cricket',
        'location': 'Indiranagar',
        'rating': 4.9,
        'price': 620,
        'badge': 'Top rated'
    },
    {
        'id': 3,
        'name': 'Smash Zone',
        'sport': 'Badminton',
        'location': 'HSR Layout',
        'rating': 4.7,
        'price': 320,
        'badge': 'Popular'
    }
]
BOOKINGS = []


class CourtlyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        route = parsed.path

        if route == '/api/health':
            self.send_json(200, {'status': 'ok', 'message': 'Courtly backend is running'})
            return

        if route == '/api/venues':
            self.send_json(200, BASE_VENUES)
            return

        if route == '/api/bookings':
            self.send_json(200, BOOKINGS)
            return

        if route == '/':
            route = '/index.html'

        file_path = os.path.normpath(os.path.join(ROOT, route.lstrip('/')))
        if os.path.commonpath([ROOT, file_path]) != ROOT:
            self.send_error(403, 'Forbidden')
            return

        if os.path.isdir(file_path):
            file_path = os.path.join(file_path, 'index.html')

        if not os.path.isfile(file_path):
            self.send_error(404, 'File not found')
            return

        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type is None:
            mime_type = 'application/octet-stream'

        with open(file_path, 'rb') as file:
            content = file.read()

        self.send_response(200)
        self.send_header('Content-Type', mime_type)
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self):
        parsed = urlparse(self.path)
        route = parsed.path

        if route != '/api/bookings':
            self.send_error(404, 'Not found')
            return

        try:
            length = int(self.headers.get('Content-Length', '0'))
            payload = self.rfile.read(length)
            body = json.loads(payload.decode('utf-8')) if payload else {}
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {'message': 'Invalid JSON payload'})
            return

        venue_id = body.get('venueId')
        date = body.get('date')
        duration = body.get('duration')

        if venue_id is None or date is None or duration is None:
            self.send_json(400, {'message': 'Missing required fields: venueId, date, duration'})
            return

        venue = next((item for item in BASE_VENUES if item['id'] == int(venue_id)), None)
        if venue is None:
            self.send_json(404, {'message': 'Venue not found'})
            return

        booking = {
            'id': int(datetime.now(timezone.utc).timestamp() * 1000),
            'venueId': int(venue_id),
            'venueName': venue['name'],
            'sport': venue['sport'],
            'date': date,
            'duration': int(duration),
            'total': venue['price'] * int(duration),
            'createdAt': datetime.now(timezone.utc).isoformat()
        }

        BOOKINGS.append(booking)
        self.send_json(201, {'message': 'Booking created successfully', 'booking': booking})

    def send_json(self, status_code, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


if __name__ == '__main__':
    server = ThreadingHTTPServer(('0.0.0.0', 8000), CourtlyHandler)
    print('Courtly server running at http://localhost:8000')
    server.serve_forever()
