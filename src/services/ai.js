import { getSettings } from './storage.js'

// AI 接口服务
// 支持 DeepSeek 和通义千问两个接口

const AI_PROVIDERS = {
  deepseek: {
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
    body: (messages) => ({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  },
  qwen: {
    name: '通义千问',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: 'qwen-turbo',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
    body: (messages) => {
      // 通义千问需要把 messages 转换成单轮 prompt
      const lastMessage = messages[messages.length - 1]
      return {
        model: 'qwen-turbo',
        input: {
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
        },
      }
    },
    // 通义千问的响应格式不同
    parseResponse: (data) => {
      return data.output?.text || data.output?.choices?.[0]?.message?.content || ''
    },
  },
  zhipu: {
    name: '智谱 GLM',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-flash',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }),
    body: (messages) => ({
      model: 'glm-4-flash',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  },
}

// 构建洞察 Prompt
function buildInsightPrompt(notes) {
  const notesText = notes.map((note, index) => {
    return `笔记${index + 1}：\n标题：${note.title}\n内容：${note.content}\n`
  }).join('\n')

  return `你是一位专业的思维教练和洞察分析师。请对以下${notes.length}条笔记进行深度分析，从三个维度给出洞察。

${notesText}

请以如下 JSON 格式返回结果（只返回 JSON，不要有其他内容）：
{
  "themes": ["主题1", "主题2", "主题3"],
  "themesAnalysis": "对核心主题的详细分析（100-150字）",
  "blindSpots": ["盲点1", "盲点2", "盲点3"],
  "blindSpotsAnalysis": "对思维盲点的详细分析（100-150字）",
  "questions": ["问题1", "问题2", "问题3"],
  "questionsAnalysis": "对深刻问题的引导分析（100-150字）"
}

要求：
1. themes：识别笔记中的3个核心主题，简洁有力
2. themesAnalysis：深入分析这些主题之间的关联和深层含义
3. blindSpots：指出思考中可能忽略的3个角度或盲点
4. blindSpotsAnalysis：解释为什么这些是盲点，如何弥补
5. questions：提出3个引导性的深刻反思问题
6. questionsAnalysis：说明这些问题为何值得深入思考`
}

// 解析 AI 响应
function parseAIResponse(text) {
  try {
    // 尝试提取 JSON（可能有 markdown 代码块包裹）
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        themes: parsed.themes || [],
        themesAnalysis: parsed.themesAnalysis || '',
        blindSpots: parsed.blindSpots || [],
        blindSpotsAnalysis: parsed.blindSpotsAnalysis || '',
        questions: parsed.questions || [],
        questionsAnalysis: parsed.questionsAnalysis || '',
      }
    }
    throw new Error('无法解析响应')
  } catch (error) {
    // 解析失败，返回原始文本
    console.error('解析 AI 响应失败:', error)
    return {
      themes: ['AI 响应解析失败'],
      themesAnalysis: text.substring(0, 200),
      blindSpots: ['请重试'],
      blindSpotsAnalysis: 'AI 返回的格式无法解析，请稍后重试。',
      questions: ['需要帮助吗？'],
      questionsAnalysis: '如果问题持续存在，请检查 API 配置。',
    }
  }
}

// 调用 AI 接口
export async function generateInsight(notes) {
  const settings = getSettings()
  const provider = settings.aiProvider || 'deepseek'
  const apiKey = provider === 'deepseek'
    ? settings.deepseekApiKey
    : provider === 'zhipu'
      ? settings.zhipuApiKey
      : settings.qwenApiKey

  if (!apiKey) {
    throw new Error(`请先在设置中配置 ${AI_PROVIDERS[provider].name} 的 API Key`)
  }

  const providerConfig = AI_PROVIDERS[provider]
  const prompt = buildInsightPrompt(notes)

  const messages = [
    {
      role: 'system',
      content: '你是一位专业的思维教练和洞察分析师，擅长从笔记中提取核心主题、发现思维盲点、提出深刻问题。请 always 以 JSON 格式返回结果。',
    },
    {
      role: 'user',
      content: prompt,
    },
  ]

  try {
    const response = await fetch(providerConfig.apiUrl, {
      method: 'POST',
      headers: providerConfig.headers(apiKey),
      body: JSON.stringify(providerConfig.body(messages)),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`${AI_PROVIDERS[provider].name} 接口调用失败 (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    // 解析响应内容
    let content = ''
    if (provider === 'qwen' && providerConfig.parseResponse) {
      content = providerConfig.parseResponse(data)
    } else {
      content = data.choices?.[0]?.message?.content || ''
    }

    if (!content) {
      throw new Error('AI 返回内容为空')
    }

    return parseAIResponse(content)
  } catch (error) {
    console.error('AI 调用失败:', error)
    throw error
  }
}

// 生成单条笔记的快洞察
export async function generateQuickInsight(note) {
  return generateInsight([note])
}

// 检查 AI 是否已配置
export function isAIConfigured() {
  const settings = getSettings()
  const provider = settings.aiProvider || 'deepseek'
  const apiKey = provider === 'deepseek'
    ? settings.deepseekApiKey
    : provider === 'zhipu'
      ? settings.zhipuApiKey
      : settings.qwenApiKey
  return !!apiKey
}

// 获取当前 AI 提供商名称
export function getAIProviderName() {
  const settings = getSettings()
  const provider = settings.aiProvider || 'deepseek'
  return AI_PROVIDERS[provider].name
}

// 测试 API 连接
export async function testAPIConnection() {
  const settings = getSettings()
  const provider = settings.aiProvider || 'deepseek'
  const apiKey = provider === 'deepseek'
    ? settings.deepseekApiKey
    : provider === 'zhipu'
      ? settings.zhipuApiKey
      : settings.qwenApiKey

  if (!apiKey) {
    throw new Error(`请先在设置中配置 ${AI_PROVIDERS[provider].name} 的 API Key`)
  }

  const providerConfig = AI_PROVIDERS[provider]

  const messages = [
    { role: 'user', content: '你好，请回复"连接成功"' }
  ]

  try {
    const response = await fetch(providerConfig.apiUrl, {
      method: 'POST',
      headers: providerConfig.headers(apiKey),
      body: JSON.stringify(providerConfig.body(messages)),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`接口返回错误 (${response.status}): ${errorText.substring(0, 200)}`)
    }

    const data = await response.json()

    // 解析响应内容
    let content = ''
    if (provider === 'qwen' && providerConfig.parseResponse) {
      content = providerConfig.parseResponse(data)
    } else {
      content = data.choices?.[0]?.message?.content || ''
    }

    if (!content) {
      throw new Error('API 返回内容为空')
    }

    return { success: true, message: `${AI_PROVIDERS[provider].name} 连接成功`, content }
  } catch (error) {
    console.error('API 测试失败:', error)
    throw new Error(error.message || '连接失败，请检查网络或 API Key')
  }
}

// AI 生成标题
export async function generateTitle(content) {
  const settings = getSettings()
  const provider = settings.aiProvider || 'deepseek'
  const apiKey = provider === 'deepseek'
    ? settings.deepseekApiKey
    : provider === 'zhipu'
      ? settings.zhipuApiKey
      : settings.qwenApiKey

  if (!apiKey) {
    throw new Error('请先配置 AI API Key')
  }

  const providerConfig = AI_PROVIDERS[provider]

  const messages = [
    {
      role: 'system',
      content: '你是一个标题生成助手。请根据用户提供的笔记内容，生成一个简洁、有吸引力的标题（不超过15个字）。只返回标题文字，不要加任何解释。'
    },
    {
      role: 'user',
      content: `请为以下内容生成一个标题：\n\n${content.substring(0, 500)}`
    }
  ]

  try {
    const response = await fetch(providerConfig.apiUrl, {
      method: 'POST',
      headers: providerConfig.headers(apiKey),
      body: JSON.stringify(providerConfig.body(messages)),
    })

    if (!response.ok) {
      throw new Error(`接口调用失败 (${response.status})`)
    }

    const data = await response.json()

    let result = ''
    if (provider === 'qwen' && providerConfig.parseResponse) {
      result = providerConfig.parseResponse(data)
    } else {
      result = data.choices?.[0]?.message?.content || ''
    }

    // 清理标题：去除引号、换行等多余字符
    return result.replace(/["""']/g, '').replace(/\n/g, '').trim().substring(0, 20)
  } catch (error) {
    console.error('生成标题失败:', error)
    throw error
  }
}
