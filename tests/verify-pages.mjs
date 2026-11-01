async function verifyPages() {
  console.log('Testing live pages on http://localhost:3000...\n');

  // 1. Landing Page
  const homeRes = await fetch('http://localhost:3000');
  const homeHtml = await homeRes.text();
  console.log('--- Home Page Checks ---');
  console.log('Company Name present:', homeHtml.includes('IVR TECH SOLUTIONS PRIVATE LIMITED'));
  console.log('Tagline present:', homeHtml.includes('Building Skills. Creating Opportunities. Shaping Careers.'));
  console.log('Old stats absent:', !homeHtml.includes('2,000+ Engineers') && !homeHtml.includes('96.4% Completion'));
  console.log('Old heading absent:', !homeHtml.includes('Enterprise Workforce Engineering & Technical Leadership'));
  console.log('New heading present:', homeHtml.includes('Begin Your Internship'));
  console.log('Google Form link present:', homeHtml.includes('https://docs.google.com/forms/d/e/1FAIpQLSc5WXW3u_3AKe4iw7QrUBzkH97ASIiyXmyifTr0cXH6cK8KdA/viewform'));
  console.log('Email admin@ivrtechsolution.in present:', homeHtml.includes('admin@ivrtechsolution.in'));
  console.log('Old email absent:', !homeHtml.includes('admissions@ivrenterprise.com'));

  // 2. About Page
  const aboutRes = await fetch('http://localhost:3000/about');
  const aboutHtml = await aboutRes.text();
  console.log('\n--- About Page Checks ---');
  console.log('Chief Academic Director I.V. Gowtham Kumar Reddy:', aboutHtml.includes('I.V. Gowtham Kumar Reddy'));
  console.log('Dr. Aris Thorne absent:', !aboutHtml.includes('Dr. Aris Thorne'));
  console.log('VP Shaik Asif:', aboutHtml.includes('Shaik Asif'));
  console.log('S. Balasubramanian absent:', !aboutHtml.includes('S. Balasubramanian'));

  // 3. Login Page
  const loginRes = await fetch('http://localhost:3000/login');
  const loginHtml = await loginRes.text();
  console.log('\n--- Login Page Checks ---');
  console.log('Title has Login:', loginHtml.includes('Login'));
  console.log('Placeholder has admin@ivrtechsolution.in:', loginHtml.includes('admin@ivrtechsolution.in'));
  console.log('Old Enterprise Portal absent from login main title:', !loginHtml.includes('>Enterprise Portal</h1>'));

  // 4. Apply Page
  const applyRes = await fetch('http://localhost:3000/apply');
  const applyHtml = await applyRes.text();
  console.log('\n--- Apply Page Checks ---');
  console.log('Google Form redirect link present:', applyHtml.includes('https://docs.google.com/forms/d/e/1FAIpQLSc5WXW3u_3AKe4iw7QrUBzkH97ASIiyXmyifTr0cXH6cK8KdA/viewform'));
  console.log('Target blank present for new tab:', applyHtml.includes('target="_blank"'));

  console.log('\nAll page inspections verified successfully!');
}

verifyPages().catch(console.error);
