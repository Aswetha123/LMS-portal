import React, { useState, useEffect } from 'react';
import API from '../api';

export default function CertificatesView({ user, showNotification }) {
  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const data = await API.getMyCertificates();
      setCertificates(data);
    } catch (err) {
      showNotification('Failed to fetch certificates: ' + err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const handlePrint = () => {
    if (!selectedCert) return;

    const course = selectedCert.courseId || {};
    const recipient = user?.email?.split('@')[0].toUpperCase() || 'STUDENT';
    const date = selectedCert.createdAt ? selectedCert.createdAt.split('T')[0] : new Date().toLocaleDateString();

    const certHtml = `
      <div class="certificate-preview-card" id="printable-certificate">
        <div class="cert-subtitle">Certificate of Achievement</div>
        <div class="cert-title">VORTEX LEARNING LMS</div>
        <div>is proudly presented to</div>
        <div class="cert-recipient">${recipient}</div>
        <div>for successfully completing the course</div>
        <div class="cert-course">${course.name || 'Course Name'}</div>
        <div style="font-size:13px; color:#718096; max-width:400px; text-align:center; margin-top:8px;">
          Demonstrating proficiency in curriculum topics, modules review, and practical assessments.
        </div>
        
        <div class="cert-footer">
          <div class="cert-meta">
            <div>DATE: <strong>${date}</strong></div>
            <div>VERIFICATION ID: <span style="font-family:monospace;">${selectedCert._id}</span></div>
          </div>
          <div class="cert-signature">
            <span>Vortex Admin</span>
            <div class="cert-sig-line"></div>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Certificate</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color:#fff;}
      .certificate-preview-card {
        width: 750px; aspect-ratio: 1.414 / 1; background: #fff; color: #1a1a1a;
        border: 15px solid #7c3aed; padding: 40px; text-align: center; box-sizing: border-box;
        display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      }
      .cert-title { font-size: 32px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; width: 80%; margin:0 auto; color: #7c3aed;}
      .cert-subtitle { font-size: 14px; color: #6b7280; text-transform: uppercase; margin-bottom:10px;}
      .cert-recipient { font-size: 26px; font-weight: 700; color: #1f2937; margin: 15px 0; font-style: italic; }
      .cert-course { font-size: 22px; font-weight: 600; color: #7c3aed; margin-bottom:15px; }
      .cert-footer { width: 100%; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align:left;}
      .cert-meta { font-size: 11px; color: #6b7280; }
      .cert-signature { display: flex; flex-direction: column; align-items: center; font-size: 14px; font-weight: 600; color: #4a5568; }
      .cert-sig-line { width: 120px; height: 1px; background: #4a5568; margin-top: 8px; }
    `);
    printWindow.document.write('</style></head><body>');
    printWindow.document.write(certHtml);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    // Auto trigger print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const recipientName = user?.email?.split('@')[0].toUpperCase() || 'STUDENT';

  return (
    <section id="view-student-certificates" className="section" style={{ display: 'block' }}>
      <div className="container">
        <h1 className="section-title">My Certifications</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.1rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          View and download certificates earned for completing courses.
        </p>
        
        <div className="dashboard-grid">
          <div className="glass-card">
            <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-award" style={{ color: 'var(--primary-purple)', marginRight: '8px' }}></i> 
              Issued Certificates
            </h3>
            
            {loading ? (
              <p style={{ padding: '20px', textAlign: 'center' }}>Loading certificates...</p>
            ) : certificates.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                You haven't earned any certificates yet. Complete a course to 100% to generate one!
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="lms-table">
                  <thead>
                    <tr>
                      <th>Course Name</th>
                      <th>Issued Date</th>
                      <th>Certificate ID</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map(cert => {
                      const course = cert.courseId || {};
                      const date = cert.createdAt ? cert.createdAt.split('T')[0] : 'N/A';
                      return (
                        <tr key={cert._id}>
                          <td style={{ fontWeight: 600 }}>{course.name || 'LMS Course'}</td>
                          <td>{date}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>{cert._id}</td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCert(cert)}>
                              <i className="fa-solid fa-eye"></i> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Live Certificate Preview Container */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '400px', justifyContent: 'center' }}>
            <h3 style={{ marginBottom: '6px', fontSize: '1.2rem' }}>Certificate Viewer</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px' }}>
              Select an issued certificate from the list to preview it here.
            </p>
            
            <div id="certificate-viewer-render" style={{ width: '100%' }}>
              {selectedCert ? (
                <>
                  <div className="certificate-preview-card" id="printable-certificate" style={{ margin: '0 auto' }}>
                    <div className="cert-subtitle">Certificate of Achievement</div>
                    <div className="cert-title">VORTEX LEARNING LMS</div>
                    <div>is proudly presented to</div>
                    <div className="cert-recipient" style={{ fontStyle: 'italic', fontWeight: 'bold' }}>{recipientName}</div>
                    <div>for successfully completing the course</div>
                    <div className="cert-course" style={{ fontWeight: 'bold' }}>{selectedCert.courseId?.name || 'Course Name'}</div>
                    <div style={{ fontSize: '13px', color: '#718096', maxWidth: '400px', textAlign: 'center', marginTop: '8px' }}>
                      Demonstrating proficiency in curriculum topics, modules review, and practical assessments.
                    </div>
                    
                    <div className="cert-footer">
                      <div className="cert-meta">
                        <div>DATE: <strong>{selectedCert.createdAt ? selectedCert.createdAt.split('T')[0] : 'N/A'}</strong></div>
                        <div>VERIFICATION ID: <span style={{ fontFamily: 'monospace' }}>{selectedCert._id}</span></div>
                      </div>
                      <div className="cert-signature">
                        <span>Vortex Admin</span>
                        <div className="cert-sig-line"></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button className="btn btn-primary btn-sm" id="btn-print-cert" onClick={handlePrint}>
                      <i className="fa-solid fa-print"></i> Print / Save PDF
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ border: '2px dashed var(--border-gray)', padding: '40px', textAlign: 'center', borderRadius: 'var(--border-radius-md)', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-award fa-3x" style={{ marginBottom: '12px', color: 'var(--primary-purple)' }}></i>
                  <p>No Certificate Selected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
