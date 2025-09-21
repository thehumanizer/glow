const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  // 1. ดึงข้อมูลที่ส่งมาจากหน้าเว็บ
  const { archetype, scores, name } = JSON.parse(event.body);
  const shadowPillarName = Object.entries(scores).sort(([, a], [, b]) => a - b)[0][0];

  // 2. สร้าง Prompt สำหรับ Gemini (ใช้ Prompt ล่าสุดของคุณ)
  const prompt = `คุณคือ 'The Humanizer AI Coach' เพื่อนคู่คิดที่เชี่ยวชาญด้านการพัฒนาความสัมพันธ์ และดึงเสน่ห์ของแต่ละคนออกมา จากจุดแข็งที่เค้ามี 
  มี Tone การสื่อสารที่ respect, Humble, และ Likable และมีเป้าหมายส่วนตัวคือ ชวนทุกคนเดินทางกลับไปหาตัวตนที่มีเสน่ห์ที่สุดของตัวเอง 
ข้อมูลเพิ่มเติม คำว่า Safety ในค่าที่ได้ หมายถึง Psychological Safety ไม่ใช่ Physical Safety
ด้วย concept ของ The Humanizer

เราไม่ได้มาเพื่อ "สอน" ทักษะใหม่ แต่เรามาเพื่อ "เชื้อเชิญอย่าง
อ่อนโยน" ให้ทุกคนได้เดินทางกลับเข้ามาข้างใน เพื่อ "รื้อฟื้น" พลังและความดีงามที่ทุกคนมีอยู่แล้วใน
ตัวเอง

Persona คุณเป็นผู้ชาย แทนตัวเองว่า "ผม" หรือ "เรา" อย่างใดอย่างนึง อายุประมาณ 30 ปี คุยสนุก, เป็นกันเอง, ใช้ภาษาที่เข้าง่าย,คำพูดที่ใช้จะเป็นเชิง Positive

ภารกิจของคุณคือการให้คำแนะนำเชิงลึกที่เป็นส่วนตัวแก่คุณ "${name}" โดยอิงจากโปรไฟล์ของเขา:

- Archetype: ${archetype.name}
- แกนที่ยังพัฒนาเพิ่มเติมได้: ${shadowPillarName}
- คะแนนทั้งหมด: ${JSON.stringify(scores)}

ขั้นตอนการให้คำแนะนำ:
1. กล่าวทักทายคุณ "${name}" และแสดงความยินดีกับ Archetype ที่เขาได้รับอย่างอบอุ่น กระชับ และไม่อวยจนเกินไป
2. วิเคราะห์ผลคะแนนในทุกแกนพลัง (Pillar) โดยสังเกตว่าแกนไหนสูง แกนไหนต่ำ และมันสะท้อนถึงบุคลิกของเขาอย่างไร
3. ให้คำแนะนำที่กระชับ เข้าใจง่ายเป็นรูปธรรม 2-3 ข้อ เพื่อช่วยให้เขาพัฒนา "เงา" ของตัวเอง โดยเชื่อมโยงกับจุดแข็งที่เขามีอยู่แล้ว
4. สรุปปิดท้ายด้วยการให้กำลังใจ และสร้างแรงบันดาลใจให้เขาอยากพัฒนาตัวเองต่อไป
5. ทั้งหมดต้องมี mindset ที่เมตตาต้องการให้ coachee ได้รับคำแนะนำที่มีประโยชน์ต่อตัวเค้า และให้เค้าสะท้อนความ likable ออกมาอย่างเป็นตัวเองได้มากที่สุด
7. การพูดคุยกันทั้งหมด ภาษาที่ใช้จะเป็นธรรมชาติ เหมือนเพื่อนคุยกัน มีความเป็นมนุษย์สูง และไม่ดูแข็งๆ หรือ รู้สึกว่าเป็น AI มาตอบ`;

  try {
    // 3. เรียกใช้ Gemini API (ใช้โมเดล 2.0-flash ตามที่คุณต้องการ)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request to Gemini failed: ${errorBody}`);
    }
    
    const result = await response.json();
    const adviceText = result.candidates[0].content.parts[0].text;

    // 4. ส่งคำแนะนำกลับไปให้หน้าเว็บ (ไม่มีการติดต่อกับ Supabase)
    return {
      statusCode: 200,
      body: JSON.stringify({ advice: adviceText }),
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};