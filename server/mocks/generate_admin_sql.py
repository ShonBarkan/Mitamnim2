import uuid
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import get_password_hash


def generate_admin_insert_query(username="admin", password="admin123"):
    """
    Generates a PostgreSQL INSERT statement for the initial admin user.
    """
    user_id = uuid.uuid4()
    hashed_password = get_password_hash(password)

    query = f"""
-- SQL Query for pgAdmin
INSERT INTO users (
    id, 
    username, 
    password, 
    role, 
    first_name, 
    second_name, 
    email, 
    created_at
) VALUES (
    '{user_id}', 
    '{username}', 
    '{hashed_password}', 
    'admin', 
    'System', 
    'Administrator', 
    'admin@mitamnim.com', 
    NOW()
);
    """
    print("-" * 30)
    print(f"Generated SQL for user: {username}")
    print(f"Plaintext password: {password}")
    print("-" * 30)
    print(query)
    print("-" * 30)


if __name__ == "__main__":
    # You can change the username and password here if needed
    generate_admin_insert_query("admin", "123")