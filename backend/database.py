from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# This creates a local file named 'gst_helper.db' in your backend folder
DATABASE_URL = "sqlite:///./gst_helper.db"

# Create the connection engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# This will be used in main.py to talk to the DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This is the base class that our models (in models.py) will inherit from
Base = declarative_base()