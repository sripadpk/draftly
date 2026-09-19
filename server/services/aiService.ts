import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

export async function generateDocument(
  prompt: string
) {
  const interaction =
    await ai.interactions.create({
      model: 'gemini-3.6-flash',
      input: `
You are an AI writing assistant inside a document editor.

The user wants you to create a document based on this request:

"${prompt}"

Generate:
1. A concise, descriptive title for the document.
2. The complete document content.

The content can use simple Markdown formatting such as:
- **bold**
- *italic*
- # headings
- ## subheadings
- bullet lists
- numbered lists

Return ONLY valid JSON in exactly this format:

{
  "title": "Document title",
  "content": "Document content"
}

Do not wrap the JSON in markdown code fences.
`,
    })

  const rawText =
    interaction.output_text?.trim()

  if (!rawText) {
    throw new Error(
      'AI returned an empty response'
    )
  }

  const result = JSON.parse(rawText)

  if (
    typeof result.title !== 'string' ||
    typeof result.content !== 'string'
  ) {
    throw new Error(
      'AI returned an invalid document format'
    )
  }

  return {
    title: result.title.trim(),
    content: result.content.trim(),
  }
}

export async function editDocument(
  content: string,
  instruction: string
) {
  const hasExistingContent =
    content.trim().length > 0

  const prompt = hasExistingContent
    ? `
You are an AI writing assistant inside a document editor.

The user wants you to modify an existing document.

Instruction:
"${instruction}"

Existing document:
"""
${content}
"""

Follow the user's instruction while preserving
the original meaning unless the instruction asks
otherwise.

You may use simple Markdown formatting such as:
- **bold**
- *italic*
- # headings
- ## subheadings
- bullet lists
- numbered lists

Return ONLY the modified document content.

Do not add explanations before or after the document.
Do not wrap the response in markdown code fences.
`
    : `
You are an AI writing assistant inside a document editor.

The current document is completely empty.

The user wants you to create content from scratch
based on this instruction:

"${instruction}"

Write the complete document that the user requested.

You may use simple Markdown formatting such as:
- **bold**
- *italic*
- # headings
- ## subheadings
- bullet lists
- numbered lists

Return ONLY the document content.

Do not explain what you are doing.
Do not add commentary before or after the document.
Do not wrap the response in markdown code fences.
`

  const interaction =
    await ai.interactions.create({
      model: 'gemini-3.6-flash',
      input: prompt,
    })

  const text =
    interaction.output_text?.trim()

  if (!text) {
    throw new Error(
      'AI returned an empty response'
    )
  }

  return text
}