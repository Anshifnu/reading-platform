import requests

# HTML payload simulating Quill image embed
html_content = '<p>Hi, how are you? Grammar test</p><p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="></p>'

url = "http://localhost:8001/ai/grammar-check"
res = requests.post(url, json={"content": html_content})

print(res.json())
