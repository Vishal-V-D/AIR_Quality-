import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "safety_db.sqlite")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Wards Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        status TEXT NOT NULL
    )
    """)

    # Emission Sources Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS emission_sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        ward_id TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        diesel_density TEXT NOT NULL,
        status TEXT NOT NULL
    )
    """)

    # Enforcement Actions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS enforcement_actions (
        id TEXT PRIMARY KEY,
        ward_id TEXT NOT NULL,
        source_id TEXT NOT NULL,
        description TEXT NOT NULL,
        officer TEXT NOT NULL,
        status TEXT NOT NULL,
        gps_lat REAL NOT NULL,
        gps_lng REAL NOT NULL,
        timestamp TEXT NOT NULL,
        initial_aqi REAL,
        post_aqi REAL
    )
    """)

    # Seed Wards
    cursor.execute("DELETE FROM wards")
    wards_data = [
        ("Ward-1", "Connaught Place", 28.6304, 77.2177, "Nominal"),
        ("Ward-2", "Dwarka Sector 10", 28.5850, 77.0490, "Nominal"),
        ("Ward-3", "Okhla Industrial Area", 28.5350, 77.2850, "Nominal"),
        ("Ward-4", "Anand Vihar", 28.6470, 77.3150, "Nominal"),
        ("Ward-5", "Punjabi Bagh", 28.6610, 77.1240, "Nominal"),
        ("Ward-6", "Wazirpur Industrial Area", 28.6990, 77.1680, "Nominal")
    ]
    cursor.executemany("INSERT INTO wards (id, name, lat, lng, status) VALUES (?, ?, ?, ?, ?)", wards_data)

    # Seed Emission Sources
    cursor.execute("DELETE FROM emission_sources")
    sources_data = [
        ("SRC-101", "Dwarka Expressway Metro Construction", "Construction", "Ward-2", 28.5860, 77.0485, "High", "Active"),
        ("SRC-102", "Okhla Metal Casting Plant", "Industrial", "Ward-3", 28.5360, 77.2840, "Moderate", "Active"),
        ("SRC-103", "Anand Vihar Inter-State Bus Terminus", "Diesel Transport", "Ward-4", 28.6480, 77.3160, "Critical", "Active"),
        ("SRC-104", "Wazirpur Steel Pickling Unit", "Industrial", "Ward-6", 28.7000, 77.1670, "Moderate", "Active"),
        ("SRC-105", "Punjabi Bagh Flyover Project", "Construction", "Ward-5", 28.6620, 77.1235, "High", "Active"),
        ("SRC-106", "CP Commercial Diesel Generators", "Diesel Generator", "Ward-1", 28.6310, 77.2170, "Low", "Active")
    ]
    cursor.executemany("INSERT INTO emission_sources (id, name, type, ward_id, lat, lng, diesel_density, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", sources_data)

    # Seed Enforcement Actions
    cursor.execute("DELETE FROM enforcement_actions")
    today = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    actions_data = [
        ("ACT-101", "Ward-4", "SRC-103", "Intercept non-BS6 diesel vehicles at border checkpost and issue compliance citation.", "Inspector V. Chauhan", "Dispatched", 28.6480, 77.3160, today, 244.0, None),
        ("ACT-102", "Ward-3", "SRC-102", "Audit dust scrubber unit operation and seal furnace pressure dampers.", "Officer S. Malhotra", "Completed", 28.5360, 77.2840, today, 180.0, 42.0)
    ]
    cursor.executemany("INSERT INTO enforcement_actions (id, ward_id, source_id, description, officer, status, gps_lat, gps_lng, timestamp, initial_aqi, post_aqi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", actions_data)

    conn.commit()
    conn.close()

def get_db_connection():
    return sqlite3.connect(DB_PATH)

if __name__ == "__main__":
    init_db()
    print("Air Quality database initialized successfully at:", DB_PATH)
