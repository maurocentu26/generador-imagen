import base64

logo_b64 = base64.b64encode(
    open(r'C:\Users\mauro\.gemini\antigravity\brain\72a684f6-fa0f-440d-9780-314b7ee658a4\.user_uploaded\media_1789599174454.png', 'rb').read()
).decode('utf-8')

template = open(r'C:\Users\mauro\.gemini\antigravity\scratch\flyer_maker\index_template.html', 'r', encoding='utf-8').read()
final = template.replace('LOGO_PLACEHOLDER', logo_b64)
open(r'C:\Users\mauro\.gemini\antigravity\scratch\flyer_maker\index.html', 'w', encoding='utf-8').write(final)
print('index.html generated OK')
