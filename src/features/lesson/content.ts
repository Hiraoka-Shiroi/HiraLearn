import { LessonContent } from '@/types/lesson';

export const HTML_MODULE_LESSONS: LessonContent[] = [
  {
    id: 'html-1',
    title: 'What is HTML',
    module: 'HTML Basics',
    theory: 'HTML stands for HyperText Markup Language. It uses tags to structure a web page. Every page starts with <!DOCTYPE html>, <html>, <head>, and <body>.',
    task: 'Add a <body> tag inside the <html> tag. Inside the body, write "Hello Sensei".',
    starterCode: '<html>\n  <head></head>\n  <!-- Add body here -->\n</html>',
    solutionRegex: [/<body>/i, /Hello Sensei/i, /<\/body>/i],
    hint: 'The <body> tag goes after the <head> tag and before the closing </html> tag.'
  },
  {
    id: 'html-2',
    title: 'Text: Headers and Paragraphs',
    module: 'HTML Basics',
    theory: 'Use <h1> to <h6> for headings and <p> for paragraphs. <strong> makes text bold, <em> makes it italic.',
    task: 'Create an <h1> heading with "My Blog" and a <p> paragraph below it.',
    starterCode: '',
    solutionRegex: [/<h1.*?>.*?<\/h1>/i, /<p.*?>.*?<\/p>/i],
    hint: 'Start with <h1>Title</h1> and then add <p>Text</p>.'
  },
  {
    id: 'html-3',
    title: 'Links and Images',
    module: 'HTML Basics',
    theory: '<a> tags create links (href attribute), and <img> tags embed images (src and alt attributes).',
    task: 'Create a link to "google.com" with the text "Search".',
    starterCode: '',
    solutionRegex: [/<a\s+href=.*?>.*?<\/a>/i, /google\.com/i],
    hint: 'Use <a href="https://google.com">Search</a>.'
  },
  {
    id: 'html-4',
    title: 'Lists',
    module: 'HTML Basics',
    theory: '<ul> is for bullet points, <ol> for numbered lists. Each item is <li>.',
    task: 'Create an unordered list with two items: "HTML" and "CSS".',
    starterCode: '<ul>\n</ul>',
    solutionRegex: [/<ul>/i, /<li>HTML<\/li>/i, /<li>CSS<\/li>/i, /<\/ul>/i],
    hint: 'Put <li> tags inside the <ul> tag.'
  },
  {
    id: 'html-5',
    title: 'Buttons',
    module: 'HTML Basics',
    theory: 'The <button> tag creates a clickable button. It is different from a link because it usually triggers an action rather than navigating.',
    task: 'Create a button that says "Click Me".',
    starterCode: '',
    solutionRegex: [/<button.*?>.*?<\/button>/i, /Click Me/i],
    hint: 'Just use <button>Your Text</button>.'
  },
  {
    id: 'html-6',
    title: 'Forms and Inputs',
    module: 'HTML Basics',
    theory: '<form> groups inputs. <label> describes the input, and <input> is where the user types.',
    task: 'Create an input with a label "Name:".',
    starterCode: '<form>\n</form>',
    solutionRegex: [/<label.*?>.*?<\/label>/i, /<input.*?>/i],
    hint: 'Label and input usually go together inside a form.'
  },
  {
    id: 'html-7',
    title: 'Semantics',
    module: 'HTML Basics',
    theory: 'Semantic tags like <header>, <main>, <section>, and <footer> tell the browser what parts of the page are what.',
    task: 'Wrap a <p> tag inside a <main> tag.',
    starterCode: '',
    solutionRegex: [/<main.*?>.*?<\/main>/i, /<p.*?>.*?<\/p>/i],
    hint: 'Put the <p> inside the <main> opening and closing tags.'
  },
  {
    id: 'html-8',
    title: 'Final Project',
    module: 'HTML Basics',
    theory: 'Time to combine everything! A portfolio page needs a header, a section for about me, and a list of skills.',
    task: 'Create a page with a <header>, an <h1>, and a <ul> with your skills.',
    starterCode: '<!-- Build your portfolio here -->',
    solutionRegex: [/<header/i, /<h1/i, /<ul/i, /<li/i],
    hint: 'Think about the structure: Header -> Main -> Section -> List.'
  }
];
