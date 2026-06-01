import React from "react";

function SupportPage() {
  const faqs = [
    { q: "Làm thế nào để đổi mật khẩu?", a: "Bạn vào trang Cá nhân > Đổi mật khẩu để thực hiện thay đổi." },
    { q: "Thời gian giao hàng là bao lâu?", a: "Thông thường từ 2-4 ngày làm việc tùy khu vực." },
    { q: "Chính sách đổi trả như thế nào?", a: "Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất." }
  ];

  return (
    <div className="support-page bg-light min-vh-100 py-5">
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="fw-bold">Trung tâm hỗ trợ</h1>
          <p className="text-muted">Tìm kiếm câu trả lời cho các thắc mắc thường gặp của bạn</p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold mb-4">Câu hỏi thường gặp (FAQs)</h5>
              <div className="accordion accordion-flush" id="faqAccordion">
                {faqs.map((f, i) => (
                  <div className="accordion-item border-bottom py-2" key={i}>
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed fw-bold bg-transparent shadow-none" type="button" data-bs-toggle="collapse" data-bs-target={`#faq${i}`}>
                        {f.q}
                      </button>
                    </h2>
                    <div id={`faq${i}`} className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body text-muted">
                        {f.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportPage;
