-- Se connecter à la base de données postgres pour pouvoir supprimer polygone
\c postgres;

DROP DATABASE IF EXISTS mailapp;
CREATE DATABASE mailapp;
\c mailapp;

CREATE TABLE EMAIL (
    id SERIAL PRIMARY KEY,
    sender VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    from_email VARCHAR(255),
    timestamp_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE TEMPLATE( 
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    date_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sender VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    from_email VARCHAR(255),
    body TEXT NOT NULL
);

CREATE TABLE CAMPAIGN_MAIL (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL  -- Added campaign name field
);

CREATE TABLE MAIL (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES CAMPAIGN_MAIL(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    UNIQUE(campaign_id, email)  -- Prevents duplicate emails per campaign
);