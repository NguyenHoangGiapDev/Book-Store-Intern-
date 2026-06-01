const fs = require('fs');

const filePath = 'c:/Users/Admin/Desktop/BookStore/Frontend/book-store-client/src/components/admin/AdminAuthorsPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update handleSave payload to preserve existing BirthDate
const oldPayloadDate = 'BirthDate: String(formData.get("birthDate") || "").trim() || null,';
const newPayloadDate = 'BirthDate: editingAuthor?.birthDate ? String(editingAuthor.birthDate).slice(0, 10) : null,';

if (content.includes(oldPayloadDate)) {
  content = content.replace(oldPayloadDate, newPayloadDate);
  console.log('Successfully updated handleSave payload for BirthDate!');
} else {
  console.error('Could not find old handleSave BirthDate payload in AdminAuthorsPage.jsx');
}

// 2. Remove NGÀY SINH from JSX
const jsxBlock = `                    <div className="col-md-6">
                      <label className="stationery-book-label">
                        <i className="bi bi-calendar-event-fill"></i>
                        NGÀY SINH
                      </label>

                      <input
                        type="date"
                        name="birthDate"
                        className="stationery-book-input"
                        defaultValue={
                          editingAuthor?.birthDate
                            ? String(editingAuthor.birthDate).slice(0, 10)
                            : ""
                        }
                      />
                    </div>`;

// Normalize newlines in both content and jsxBlock to handle Windows line ends
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedJsx = jsxBlock.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedJsx)) {
  const updatedContent = normalizedContent.replace(normalizedJsx, '');
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log('Successfully removed NGÀY SINH form block!');
} else {
  // Try matching with different newlines or minor spacing variations using regex
  const fallbackRegex = /<div className="col-md-6">\s*<label className="stationery-book-label">\s*<i className="bi bi-calendar-event-fill"><\/i>\s*NGÀY SINH\s*<\/label>[\s\S]*?<\/div>/;
  if (fallbackRegex.test(normalizedContent)) {
    const updatedContent = normalizedContent.replace(fallbackRegex, '');
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log('Successfully removed NGÀY SINH form block using regex fallback!');
  } else {
    console.error('Could not find NGÀY SINH JSX block in AdminAuthorsPage.jsx');
  }
}
