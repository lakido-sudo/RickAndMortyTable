"use strict";
// Включаем строгий режим JavaScript для лучшей безопасности и производительности

const fs = require("fs");
const pg = require("pg");
const axios = require("axios");

// Настраиваем конфигурацию подключения к базе данных PostgreSQL
const config = {
    connectionString: "postgres://candidate:62I8anq3cFq5GYh2u4Lh@rc1b-r21uoagjy1t7k77h.mdb.yandexcloud.net:6432/db1",
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync("/home/runner/.postgresql/root.crt").toString(),
    },
};

// Создаем клиента для подключения к базе данных
const conn = new pg.Client(config);

// Функция для получения списка персонажей из API "Рик и Морти"
async function fetchCharacters() {
    try {
        const response = await axios.get("https://rickandmortyapi.com/api/character");
        return response.data.results;
    } catch (error) {
        console.error("Error fetching characters:", error);
        return [];
    }
}

// Функция для создания таблицы в базе данных
async function createTable() {
    // Удаляем таблицу, если она существует, чтобы начать с чистого листа
    await conn.query("DROP TABLE IF EXISTS rickandmorty;");

    // Создаем таблицу с нужной структурой
    const createTableQuery = `
        CREATE TABLE rickandmorty (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            status VARCHAR(50),
            species VARCHAR(50),
            type VARCHAR(50),
            gender VARCHAR(50),
            origin JSONB,
            location JSONB,
            image VARCHAR(255)
        );
    `;
    await conn.query(createTableQuery);
    console.log("Table created successfully.");
}

// Функция для вставки персонажей в таблицу
async function insertCharacters(characters) {
    const insertQuery = `
        INSERT INTO rickandmorty (name, status, species, type, gender, origin, location, image) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    // Вставляем каждого персонажа в таблицу
    for (const character of characters) {
        await conn.query(insertQuery, [
            character.name,
            character.status,
            character.species,
            character.type,
            character.gender,
            character.origin,
            character.location,
            character.image,
        ]);
    }
}

// Главная функция, которая координирует выполнение всех операций
async function main() {
    // Подключаемся к базе данных
    await conn.connect();

    // Создаем таблицу
    await createTable();

    // Получаем список персонажей из API
    const characters = await fetchCharacters();

    // Вставляем персонажей в таблицу
    await insertCharacters(characters);

    console.log("Characters inserted successfully!");

    // Завершаем подключение к базе данных
    conn.end();
}

// Запускаем главную функцию и обрабатываем ошибки, если они возникнут
main().catch(err => {
    console.error("Error:", err);
    conn.end();
});
