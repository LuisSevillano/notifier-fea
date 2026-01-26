import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import * as cheerio from 'cheerio';

const URL = 'https://www3.gobiernodecanarias.org/sanidad/scs/contenidoGenerico.jsp?idDocument=21f140b9-e6b2-11ee-a2cb-95e22c31d923&idCarpeta=b8cf85ba-fc1a-11dd-a72f-93771b0e33f6';
const lastTextFile = './lastUpdate.txt';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID_1 = process.env.TELEGRAM_CHAT_ID_1;
const TELEGRAM_CHAT_ID_2 = process.env.TELEGRAM_CHAT_ID_2;

// Leer último contenido guardado
const readLastText = async () => {
  try {
    return await fs.readFile(lastTextFile, 'utf-8');
  } catch {
    return null;
  }
};

// Guardar nuevo contenido
const saveLastText = async (text) => {
  await fs.writeFile(lastTextFile, text);
};

// Enviar notificación por Telegram
const sendTelegramNotification = async (message, TELEGRAM_CHAT_ID) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error sending the notification:', error);
      process.exit(1);
    } else {
      console.log('Notification sent to Telegram.');
    }
  } catch (err) {
    console.error('Connection error with Telegram:', err);
    process.exit(1);
  }
};

// Extraer y vigilar contenido
const checkPage = async () => {
  try {
    const response = await fetch(URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const currentText = $('#centercontainer > div > div:nth-child(1) > p').text().trim();

    if (!currentText) {
      console.error('Could not find the target text.');
      process.exit(1);
    }

    console.log('Extracted text:', currentText);

    const lastText = await readLastText();

    if (currentText !== lastText) {
      await saveLastText(currentText);
      await sendTelegramNotification(`FEA Microbiología y Parasitología
 | Se ha detectado una nueva entradaºn ${URL}`, TELEGRAM_CHAT_ID_1);
      // await sendTelegramNotification(`📄 ¡Nuevo contenido detectado!\n\n${currentText}\n\n🔗 ${URL}`, TELEGRAM_CHAT_ID_2);
    } else {
      console.log('No changes detected.');
    }

  } catch (err) {
    console.error('Error fetching or processing the page:', err);
    process.exit(1);
  }
};

checkPage();
