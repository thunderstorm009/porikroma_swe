with open("app/main.py", "r") as f:
    content = f.read()

content = content.replace("    from app.api.routes import users_ext\n    app.include_router(users_ext.router, prefix=\"/api/v1\")", "from app.api.routes import users_ext\napp.include_router(users_ext.router, prefix=\"/api/v1\")")

with open("app/main.py", "w") as f:
    f.write(content)
