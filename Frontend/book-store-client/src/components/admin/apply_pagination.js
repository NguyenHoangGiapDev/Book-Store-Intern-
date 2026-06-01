const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Admin/Desktop/BookStore/Frontend/book-store-client/src/components/admin';
const files = [
  'AdminAuthorsPage.jsx',
  'AdminBooks.jsx',
  'AdminBrands.jsx',
  'AdminInventory.jsx',
  'AdminManufacturers.jsx',
  'AdminMessages.jsx',
  'AdminPromotions.jsx',
  'AdminPublishersPage.jsx',
  'AdminReviews.jsx',
  'AdminShipping.jsx',
  'AdminStationery.jsx',
  'AdminUsers.jsx'
];
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Determine state name and setter
  let setterName = '';
  if (content.includes('const [currentPage, setCurrentPage] = useState(1);')) {
    setterName = 'setCurrentPage';
  } else if (content.includes('const [page, setPage] = useState(1);')) {
    setterName = 'setPage';
  } else {
    // Fallback search
    if (content.includes('setCurrentPage')) setterName = 'setCurrentPage';
    else if (content.includes('setPage')) setterName = 'setPage';
  }

  if (!setterName) {
    console.error(`Could not determine page setter for ${file}`);
    return;
  }

  console.log(`Processing ${file} (setter: ${setterName})...`);

  // Remove the constant definition
  content = content.replace(/const ITEMS_PER_PAGE = \d+;/g, '');

  // Add the state definition
  if (setterName === 'setCurrentPage') {
    content = content.replace(
      'const [currentPage, setCurrentPage] = useState(1);',
      'const [currentPage, setCurrentPage] = useState(1);\n  const [pageSize, setPageSize] = useState(6);'
    );
  } else {
    content = content.replace(
      'const [page, setPage] = useState(1);',
      'const [page, setPage] = useState(1);\n  const [pageSize, setPageSize] = useState(6);'
    );
  }
  content = content.replace(/ITEMS_PER_PAGE/g, 'pageSize');
  const dropdownHtml = `
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="text-slate-500 x-small fw-bold text-uppercase" style={{ fontSize: '12px' }}>Số dòng:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: '75px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', border: '1px solid #e2e8f0', padding: '4px 8px', cursor: 'pointer' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    ${setterName}(1);
                  }}
                >
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div className="pagination-nav">`;
  const startIndex = content.indexOf('<div className="pagination-nav">');
  if (startIndex !== -1) {
    const endNavIndex = content.indexOf('</div>', startIndex);
    if (endNavIndex !== -1) {
      const innerNav = content.substring(startIndex + '<div className="pagination-nav">'.length, endNavIndex);
      
      const newNavBlock = `
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="text-slate-500 x-small fw-bold text-uppercase" style={{ fontSize: '12px' }}>Số dòng:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: '75px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', border: '1px solid #e2e8f0', padding: '4px 8px', cursor: 'pointer' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    ${setterName}(1);
                  }}
                >
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="pagination-nav">
                ${innerNav}
              </div>
            </div>`;
      
      content = content.substring(0, startIndex) + newNavBlock + content.substring(endNavIndex + '</div>'.length);
      console.log(`Successfully patched pagination layout in ${file}`);
    } else {
      console.error(`Could not find closing div for pagination-nav in ${file}`);
    }
  } else {
    console.error(`Could not find pagination-nav in ${file}`);
  }

  // Save the modified file
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('All files processed!');
