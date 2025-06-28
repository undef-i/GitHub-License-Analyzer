'use client'

import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip as ChartTooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import axios from 'axios'
import { Button, Input, Card, Checkbox, Alert, Typography, Row, Col, Collapse, Tag, Space, Progress, Divider, Tooltip, Badge, Select } from 'antd'
import { GithubOutlined, BarChartOutlined, ForkOutlined, LinkOutlined, StarOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, GlobalOutlined } from '@ant-design/icons'

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend)

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

interface LicenseData {
  [key: string]: Repository[]
}

interface Repository {
  id: number
  name: string
  html_url: string
  fork: boolean
  license: {
    name: string
  } | null
  stargazers_count?: number
  language?: string
  description?: string
}

interface LicensePreference {
  license: string
  score: number
  reason: string
  recommendation: string
}

interface LicenseInfo {
  name: { en: string; zh: string }
  keyword: string
  description: { en: string; zh: string }
  permissiveness: number
  category: 'permissive' | 'copyleft' | 'weak-copyleft' | 'public-domain' | 'proprietary'
  pros: { en: string[]; zh: string[] }
  cons: { en: string[]; zh: string[] }
  bestFor: { en: string[]; zh: string[] }
  notRecommendedFor: { en: string[]; zh: string[] }
}

type Language = 'en' | 'zh'

interface I18nTexts {
  title: string
  subtitle: string
  usernameLabel: string
  usernamePlaceholder: string
  analyzeButton: string
  analyzingButton: string
  includeForks: string
  includeNoLicense: string
  licensePreferenceAnalysis: string
  statistics: string
  repositoryDetails: string
  total: string
  repos: string
  forksExcluded: string
  noLicenseExcluded: string
  licenseDetails: string
  description: string
  permissivenessLevel: string
  advantages: string
  disadvantages: string
  suitableFor: string
  notRecommendedFor: string
  repositoriesUsingLicense: string
  noLicense: string
  percentageAxis: string
  userNotFound: string
  fetchError: string
}

const I18N: Record<Language, I18nTexts> = {
  en: {
    title: 'GitHub License Analyzer',
    subtitle: 'Analyze open source licenses in GitHub repositories',
    usernameLabel: 'GitHub Username',
    usernamePlaceholder: 'Enter username',
    analyzeButton: 'Analyze',
    analyzingButton: 'Analyzing...',
    includeForks: 'Include forks',
    includeNoLicense: 'Include repositories without license',
    licensePreferenceAnalysis: 'License Preference Analysis',
    statistics: 'Statistics',
    repositoryDetails: 'Repository Details',
    total: 'Total:',
    repos: 'repos',
    forksExcluded: '(forks excluded)',
    noLicenseExcluded: '(no license excluded)',
    licenseDetails: 'License Details',
    description: 'Description',
    permissivenessLevel: 'Permissiveness Level',
    advantages: 'Advantages',
    disadvantages: 'Disadvantages',
    suitableFor: 'Suitable For',
    notRecommendedFor: 'Not Recommended For',
    repositoriesUsingLicense: 'Repositories using this license',
    noLicense: 'No License',
    percentageAxis: 'Percentage (%)',
    userNotFound: 'User not found',
    fetchError: 'Failed to fetch repository data',
    extremelyPermissive: 'You extremely prefer free and permissive licenses, pursuing maximum freedom of use and commercial friendliness',
    highlyPermissive: 'You prefer highly permissive open source licenses, valuing free use and distribution of code',
    moderatelyPermissive: 'You prefer moderately permissive open source licenses, seeking balance between freedom and responsibility',
    moderatelyRestrictive: 'You prefer moderately restrictive open source licenses, focusing on code sharing and intellectual property protection',
    strictCopyleft: 'You prefer stricter copyleft licenses, emphasizing the inheritance and continuation of open source spirit',
    veryStrict: 'You prefer strict license terms, focusing on code control and usage restrictions',
    extremelyConservative: 'Your license choices are extremely conservative, prioritizing code proprietary and strict control',
    strongPreference: 'You use this license in {percent}% of your projects, totaling {count} projects, showing strong preference',
    highQuality: 'The {count} projects using this license have an average of {stars} stars, indicating high quality',
    frequentUse: 'Used in {count} of your projects, accounting for {percent}%, with high usage frequency',
    moderateUse: 'Accounts for {percent}% of your project portfolio, totaling {count} projects, with moderate usage frequency',
    stronglyRecommended: 'Strongly recommended to continue using, fits your development habits',
    recommended: 'Recommended for use, matches your project style',
    considerUse: 'Can be considered for use, suggest evaluating specific needs',
    specificScenarios: 'Suitable for specific scenarios, please choose based on project requirements',
    veryPermissive: 'Very Permissive',
    moderatelyPermissiveLevel: 'Moderately Permissive',
    moderateRestriction: 'Moderate Restriction',
    strictRestriction: 'Strict Restriction',
    proprietaryRestricted: 'Proprietary/Restricted'
  },
  zh: {
    title: 'GitHub 许可证分析器',
    subtitle: '分析 GitHub 仓库中的开源许可证分布',
    usernameLabel: 'GitHub 用户名',
    usernamePlaceholder: '输入用户名',
    analyzeButton: '分析',
    analyzingButton: '分析中...',
    includeForks: '包含 fork 仓库',
    includeNoLicense: '包含无许可证仓库',
    licensePreferenceAnalysis: '许可证偏好分析',
    statistics: '统计信息',
    repositoryDetails: '仓库详情',
    total: '总计:',
    repos: '个仓库',
    forksExcluded: '(已排除 fork 仓库)',
    noLicenseExcluded: '(已排除无许可证仓库)',
    licenseDetails: '许可证详情',
    description: '描述',
    permissivenessLevel: '宽松程度',
    advantages: '优点',
    disadvantages: '缺点',
    suitableFor: '适用场景',
    notRecommendedFor: '不推荐场景',
    repositoriesUsingLicense: '使用此许可证的仓库',
    noLicense: '无许可证',
    percentageAxis: '占比 (%)',
    userNotFound: '用户不存在',
    fetchError: '获取仓库数据失败',
    extremelyPermissive: '您非常偏好自由宽松的许可证，追求最大程度的使用自由度和商业友好性',
    highlyPermissive: '您偏好高度宽松的开源许可证，重视代码的自由使用和分发',
    moderatelyPermissive: '您偏好较为宽松的开源许可证，在自由度与责任间寻求平衡',
    moderatelyRestrictive: '您偏好中等限制的开源许可证，注重代码共享与知识产权保护',
    strictCopyleft: '您偏好较严格的copyleft许可证，强调开源精神的传承和延续',
    veryStrict: '您偏好严格的许可证条款，注重代码的控制权和使用限制',
    extremelyConservative: '您的许可证选择极为保守，优先考虑代码的专有性和严格控制',
    strongPreference: '您在{percent}%的项目中使用此许可证，共{count}个项目，显示出强烈偏好',
    highQuality: '使用此许可证的{count}个项目平均获得{stars}个星标，质量较高',
    frequentUse: '在您的{count}个项目中使用，占比{percent}%，使用频率较高',
    moderateUse: '在您的项目组合中占比{percent}%，共{count}个项目，使用频率适中',
    stronglyRecommended: '强烈推荐继续使用，符合您的开发习惯',
    recommended: '推荐使用，与您的项目风格匹配',
    considerUse: '可以考虑使用，建议评估具体需求',
    specificScenarios: '适合特定场景使用，请根据项目需求选择',
    veryPermissive: '非常宽松',
    moderatelyPermissiveLevel: '较宽松',
    moderateRestriction: '中等限制',
    strictRestriction: '严格限制',
    proprietaryRestricted: '专有/受限'
  }
}

const LICENSE_DATABASE: { [key: string]: LicenseInfo } = {
  'MIT': {
    name: {
      en: 'MIT License',
      zh: 'MIT 许可证'
    },
    keyword: 'MIT',
    description: {
      en: 'One of the most popular open source licenses, extremely permissive and concise. Allows almost any use, only requires preserving copyright notice.',
      zh: '最受欢迎的开源许可证之一，极其宽松且简洁。允许几乎任何用途，只需保留版权声明。'
    },
    permissiveness: 9,
    category: 'permissive',
    pros: {
      en: ['Extremely simple and clear', 'Business-friendly', 'Widely accepted', 'Low legal risk'],
      zh: ['极其简单易懂', '商业友好', '广泛接受', '法律风险低']
    },
    cons: {
      en: ['No patent protection', 'No warranty disclaimer'],
      zh: ['无专利保护', '无担保声明']
    },
    bestFor: {
      en: ['Personal projects', 'Commercial software', 'Libraries and frameworks', 'Rapid prototyping'],
      zh: ['个人项目', '商业软件', '库和框架', '快速原型']
    },
    notRecommendedFor: {
      en: ['Projects requiring mandatory open source', 'Patent-sensitive projects'],
      zh: ['需要强制开源的项目', '专利敏感项目']
    }
  },
  'Apache-2.0': {
    name: {
      en: 'Apache License 2.0',
      zh: 'Apache 许可证 2.0'
    },
    keyword: 'Apache-2.0',
    description: {
      en: 'Enterprise-grade open source license providing patent protection and clear contribution terms. Balances openness with legal protection.',
      zh: '企业级开源许可证，提供专利保护和明确的贡献条款。平衡了开放性和法律保护。'
    },
    permissiveness: 8,
    category: 'permissive',
    pros: {
      en: ['Patent protection', 'Clear contribution terms', 'Enterprise-friendly', 'Comprehensive legal terms'],
      zh: ['专利保护', '明确的贡献条款', '企业友好', '法律条款完善']
    },
    cons: {
      en: ['More complex than MIT', 'Longer document'],
      zh: ['比MIT复杂', '文件较长']
    },
    bestFor: {
      en: ['Enterprise projects', 'Large open source projects', 'Projects requiring patent protection'],
      zh: ['企业项目', '大型开源项目', '需要专利保护的项目']
    },
    notRecommendedFor: {
      en: ['Simple personal projects', 'Rapid prototyping'],
      zh: ['简单个人项目', '快速原型']
    }
  },
  'GPL-3.0': {
    name: {
      en: 'GNU General Public License v3.0',
      zh: 'GNU 通用公共许可证 v3.0'
    },
    keyword: 'GPL-3.0',
    description: {
      en: 'Strong copyleft license ensuring derivative works remain open source. Includes anti-DRM and patent protection clauses.',
      zh: '强copyleft许可证，确保衍生作品保持开源。包含反DRM和专利保护条款。'
    },
    permissiveness: 3,
    category: 'copyleft',
    pros: {
      en: ['Mandatory open source', 'Patent protection', 'Anti-DRM protection', 'Protects user freedom'],
      zh: ['强制开源', '专利保护', '反DRM保护', '保护用户自由']
    },
    cons: {
      en: ['Commercial use restrictions', 'Complex compliance requirements', 'May hinder commercial adoption'],
      zh: ['商业使用限制', '复杂的合规要求', '可能阻碍商业采用']
    },
    bestFor: {
      en: ['Free software projects', 'Educational projects', 'Anti-proprietary software projects'],
      zh: ['自由软件项目', '教育项目', '反对专有软件的项目']
    },
    notRecommendedFor: {
      en: ['Commercial products', 'Projects requiring proprietary integration'],
      zh: ['商业产品', '需要专有集成的项目']
    }
  },
  'GPL-2.0': {
    name: {
      en: 'GNU General Public License v2.0',
      zh: 'GNU 通用公共许可证 v2.0'
    },
    keyword: 'GPL-2.0',
    description: {
      en: 'Classic copyleft license used by Linux kernel. More permissive than GPL-3.0, without anti-DRM clauses.',
      zh: '经典的copyleft许可证，Linux内核使用。比GPL-3.0更宽松，无反DRM条款。'
    },
    permissiveness: 4,
    category: 'copyleft',
    pros: {
      en: ['Mandatory open source', 'Mature and stable', 'Widely used', 'Many legal precedents'],
      zh: ['强制开源', '成熟稳定', '广泛使用', '法律先例多']
    },
    cons: {
      en: ['Commercial use restrictions', 'Incompatible with some licenses'],
      zh: ['商业使用限制', '与某些许可证不兼容']
    },
    bestFor: {
      en: ['System software', 'Traditional open source projects', 'Kernel-level projects'],
      zh: ['系统软件', '传统开源项目', '内核级项目']
    },
    notRecommendedFor: {
      en: ['Commercial products', 'Mobile applications'],
      zh: ['商业产品', '移动应用']
    }
  },
  'LGPL-3.0': {
    name: {
      en: 'GNU Lesser General Public License v3.0',
      zh: 'GNU 宽通用公共许可证 v3.0'
    },
    keyword: 'LGPL-3.0',
    description: {
      en: 'Weak copyleft license allowing linking in proprietary software, but modifications to the library itself must be open source.',
      zh: '弱copyleft许可证，允许在专有软件中链接使用，但修改库本身需要开源。'
    },
    permissiveness: 6,
    category: 'weak-copyleft',
    pros: {
      en: ['Allows commercial linking', 'Protects library open source nature', 'Balances openness with commercial use'],
      zh: ['允许商业链接', '保护库的开源性', '平衡开放与商用']
    },
    cons: {
      en: ['Complex compliance requirements', 'Dynamic linking restrictions'],
      zh: ['复杂的合规要求', '动态链接限制']
    },
    bestFor: {
      en: ['Software libraries', 'Middleware', 'Frameworks'],
      zh: ['软件库', '中间件', '框架']
    },
    notRecommendedFor: {
      en: ['Applications', 'Simple tools'],
      zh: ['应用程序', '简单工具']
    }
  },
  'BSD-3-Clause': {
    name: {
      en: 'BSD 3-Clause License',
      zh: 'BSD 3条款许可证'
    },
    keyword: 'BSD-3-Clause',
    description: {
      en: 'Classic permissive license that prohibits using author names for promotion without permission.',
      zh: '经典的宽松许可证，禁止未经许可使用作者姓名进行推广。'
    },
    permissiveness: 8,
    category: 'permissive',
    pros: {
      en: ['Simple and clear', 'Business-friendly', 'Long history', 'Widely accepted'],
      zh: ['简单明了', '商业友好', '历史悠久', '广泛接受']
    },
    cons: {
      en: ['No patent protection', 'Promotion restriction clause'],
      zh: ['无专利保护', '推广限制条款']
    },
    bestFor: {
      en: ['Academic projects', 'Research software', 'Traditional Unix tools'],
      zh: ['学术项目', '研究软件', '传统Unix工具']
    },
    notRecommendedFor: {
      en: ['Projects requiring patent protection'],
      zh: ['需要专利保护的项目']
    }
  },
  'BSD-2-Clause': {
    name: {
      en: 'BSD 2-Clause License',
      zh: 'BSD 2条款许可证'
    },
    keyword: 'BSD-2-Clause',
    description: {
      en: 'Simplified BSD license with promotion restriction clause removed, more permissive.',
      zh: '简化的BSD许可证，去除了推广限制条款，更加宽松。'
    },
    permissiveness: 9,
    category: 'permissive',
    pros: {
      en: ['Extremely simple', 'No promotion restrictions', 'Business-friendly'],
      zh: ['极其简单', '无推广限制', '商业友好']
    },
    cons: {
      en: ['No patent protection', 'No warranty disclaimer'],
      zh: ['无专利保护', '无担保声明']
    },
    bestFor: {
      en: ['Small tools', 'Personal projects', 'Simple libraries'],
      zh: ['小型工具', '个人项目', '简单库']
    },
    notRecommendedFor: {
      en: ['Large commercial projects', 'Patent-sensitive projects'],
      zh: ['大型商业项目', '专利敏感项目']
    }
  },
  'MPL-2.0': {
    name: {
      en: 'Mozilla Public License 2.0',
      zh: 'Mozilla 公共许可证 2.0'
    },
    keyword: 'MPL-2.0',
    description: {
      en: 'File-level copyleft license requiring only modified files to remain open source, allows mixing with proprietary code.',
      zh: '文件级copyleft许可证，只要求修改的文件保持开源，允许与专有代码混合。'
    },
    permissiveness: 7,
    category: 'weak-copyleft',
    pros: {
      en: ['File-level copyleft', 'Patent protection', 'Allows mixed licensing', 'Business-friendly'],
      zh: ['文件级copyleft', '专利保护', '允许混合许可', '商业友好']
    },
    cons: {
      en: ['Complex compliance requirements', 'Difficult file tracking'],
      zh: ['复杂的合规要求', '文件追踪困难']
    },
    bestFor: {
      en: ['Browser projects', 'Mixed license projects', 'Enterprise open source'],
      zh: ['浏览器项目', '混合许可项目', '企业开源']
    },
    notRecommendedFor: {
      en: ['Simple projects', 'Pure open source projects'],
      zh: ['简单项目', '纯开源项目']
    }
  },
  'ISC': {
    name: {
      en: 'ISC License',
      zh: 'ISC 许可证'
    },
    keyword: 'ISC',
    description: {
      en: 'Minimalist license functionally equivalent to MIT, with more concise and modern language.',
      zh: '功能上等同于MIT的极简许可证，语言更加简洁现代。'
    },
    permissiveness: 9,
    category: 'permissive',
    pros: {
      en: ['Extremely concise', 'Modern language', 'Functionally equivalent to MIT'],
      zh: ['极其简洁', '现代语言', '功能等同MIT']
    },
    cons: {
      en: ['Lower recognition', 'No patent protection'],
      zh: ['知名度较低', '无专利保护']
    },
    bestFor: {
      en: ['Node.js projects', 'Modern web projects', 'Simple tools'],
      zh: ['Node.js项目', '现代Web项目', '简单工具']
    },
    notRecommendedFor: {
      en: ['Enterprise projects', 'Projects requiring wide recognition'],
      zh: ['企业级项目', '需要广泛认知的项目']
    }
  },
  'Unlicense': {
    name: {
      en: 'The Unlicense',
      zh: '无许可证'
    },
    keyword: 'Unlicense',
    description: {
      en: 'Releases work completely to the public domain, waiving all copyrights.',
      zh: '将作品完全释放到公有领域，放弃所有版权。'
    },
    permissiveness: 10,
    category: 'public-domain',
    pros: {
      en: ['Complete freedom', 'No restrictions', 'Public domain'],
      zh: ['完全自由', '无任何限制', '公有领域']
    },
    cons: {
      en: ['No legal protection', 'Potential legal risks', 'Not recognized in all jurisdictions'],
      zh: ['无法律保护', '可能存在法律风险', '不被所有司法管辖区认可']
    },
    bestFor: {
      en: ['Tutorial code', 'Example projects', 'Personal experiments'],
      zh: ['教程代码', '示例项目', '个人实验']
    },
    notRecommendedFor: {
      en: ['Commercial projects', 'Important software', 'Projects requiring attribution'],
      zh: ['商业项目', '重要软件', '需要归属的项目']
    }
  },
  'CC0-1.0': {
    name: {
      en: 'Creative Commons Zero v1.0 Universal',
      zh: '知识共享零版权声明 v1.0'
    },
    keyword: 'CC0-1.0',
    description: {
      en: 'Creative Commons Zero copyright waiver, dedicating work to the public domain.',
      zh: '创作共用零版权声明，将作品奉献给公有领域。'
    },
    permissiveness: 10,
    category: 'public-domain',
    pros: {
      en: ['Complete freedom', 'Internationally recognized', 'Suitable for data and documents'],
      zh: ['完全自由', '国际认可', '适用于数据和文档']
    },
    cons: {
      en: ['Mainly for non-software works', 'May not be suitable for code'],
      zh: ['主要用于非软件作品', '可能不适合代码']
    },
    bestFor: {
      en: ['Datasets', 'Documentation', 'Artwork', 'Research materials'],
      zh: ['数据集', '文档', '艺术作品', '研究资料']
    },
    notRecommendedFor: {
      en: ['Software code', 'Commercial software'],
      zh: ['软件代码', '商业软件']
    }
  },
  'AGPL-3.0': {
    name: {
      en: 'GNU Affero General Public License v3.0',
      zh: 'GNU Affero 通用公共许可证 v3.0'
    },
    keyword: 'AGPL-3.0',
    description: {
      en: 'Strictest copyleft license, requiring source code provision even for network use.',
      zh: '最严格的copyleft许可证，网络使用也需要提供源代码。'
    },
    permissiveness: 2,
    category: 'copyleft',
    pros: {
      en: ['Prevents SaaS loophole', 'Strongest open source protection', 'Network copyleft'],
      zh: ['防止SaaS漏洞', '最强开源保护', '网络copyleft']
    },
    cons: {
      en: ['Commercial use nearly impossible', 'Extremely strict requirements', 'May hinder adoption'],
      zh: ['商业使用几乎不可能', '极其严格的要求', '可能阻碍采用']
    },
    bestFor: {
      en: ['Projects opposing SaaS proprietary use', 'Mandatory open source network services'],
      zh: ['反对SaaS专有化的项目', '强制开源的网络服务']
    },
    notRecommendedFor: {
      en: ['Commercial projects', 'SaaS services', 'Mobile applications'],
      zh: ['商业项目', 'SaaS服务', '移动应用']
    }
  },
  'EPL-2.0': {
    name: {
      en: 'Eclipse Public License 2.0',
      zh: 'Eclipse 公共许可证 2.0'
    },
    keyword: 'EPL-2.0',
    description: {
      en: 'Enterprise-friendly weak copyleft license allowing commercial use but requiring contribution back.',
      zh: '企业友好的弱copyleft许可证，允许商业使用但要求贡献回馈。'
    },
    permissiveness: 6,
    category: 'weak-copyleft',
    pros: {
      en: ['Enterprise-friendly', 'Patent protection', 'Allows commercial use', 'Clear contribution requirements'],
      zh: ['企业友好', '专利保护', '允许商业使用', '明确的贡献要求']
    },
    cons: {
      en: ['Complex compliance requirements', 'Incompatible with GPL'],
      zh: ['复杂的合规要求', '与GPL不兼容']
    },
    bestFor: {
      en: ['Enterprise open source projects', 'IDEs and development tools', 'Java projects'],
      zh: ['企业开源项目', 'IDE和开发工具', 'Java项目']
    },
    notRecommendedFor: {
      en: ['Simple projects', 'Projects requiring GPL compatibility'],
      zh: ['简单项目', '需要GPL兼容的项目']
    }
  },
  'WTFPL': {
    name: {
      en: 'Do What The F*ck You Want To Public License',
      zh: '随便你想干什么公共许可证'
    },
    keyword: 'WTFPL',
    description: {
      en: 'Humorous extremely permissive license allowing any use.',
      zh: '幽默的极宽松许可证，允许任何用途。'
    },
    permissiveness: 10,
    category: 'public-domain',
    pros: {
      en: ['Complete freedom', 'Humorous and fun', 'Extremely simple'],
      zh: ['完全自由', '幽默有趣', '极其简单']
    },
    cons: {
      en: ['Not formal enough', 'May not be accepted by enterprises', 'Questionable legal validity'],
      zh: ['不够正式', '可能不被企业接受', '法律效力存疑']
    },
    bestFor: {
      en: ['Personal projects', 'Experimental projects', 'Humorous projects'],
      zh: ['个人项目', '实验性项目', '幽默项目']
    },
    notRecommendedFor: {
      en: ['Commercial projects', 'Formal software', 'Enterprise environments'],
      zh: ['商业项目', '正式软件', '企业环境']
    }
  },
  'AFL-3.0': {
    name: {
      en: 'Academic Free License v3.0',
      zh: '学术自由许可证 v3.0'
    },
    keyword: 'AFL-3.0',
    description: {
      en: 'Academic free license similar to Apache 2.0, designed specifically for academic and research environments.',
      zh: '学术自由许可证，类似Apache 2.0，专为学术和研究环境设计。'
    },
    permissiveness: 8,
    category: 'permissive',
    pros: {
      en: ['Academic-friendly', 'Patent protection', 'Clear contribution terms', 'Commercial use allowed'],
      zh: ['学术友好', '专利保护', '明确的贡献条款', '商业使用允许']
    },
    cons: {
      en: ['Relatively complex', 'Lower visibility'],
      zh: ['相对复杂', '知名度较低']
    },
    bestFor: {
      en: ['Academic projects', 'Research software', 'Educational tools'],
      zh: ['学术项目', '研究软件', '教育工具']
    },
    notRecommendedFor: {
      en: ['Simple personal projects', 'Rapid prototyping'],
      zh: ['简单个人项目', '快速原型']
    }
  },
  'Artistic-2.0': {
    name: {
      en: 'Artistic License 2.0',
      zh: '艺术许可证 2.0'
    },
    keyword: 'Artistic-2.0',
    description: {
      en: 'Artistic license balancing open source requirements and commercial use, commonly used in Perl ecosystem.',
      zh: '艺术许可证，平衡了开源要求和商业使用，常用于Perl生态。'
    },
    permissiveness: 7,
    category: 'weak-copyleft',
    pros: {
      en: ['Allows commercial use', 'Flexible distribution terms', 'Perl community recognition'],
      zh: ['允许商业使用', '灵活的分发条款', 'Perl社区认可']
    },
    cons: {
      en: ['Complex terms', 'Difficult to understand'],
      zh: ['复杂的条款', '理解困难']
    },
    bestFor: {
      en: ['Perl projects', 'Artistic creation tools', 'Scripting languages'],
      zh: ['Perl项目', '艺术创作工具', '脚本语言']
    },
    notRecommendedFor: {
      en: ['Enterprise projects', 'Simple tools'],
      zh: ['企业级项目', '简单工具']
    }
  },
  'BSL-1.0': {
    name: {
      en: 'Boost Software License 1.0',
      zh: 'Boost 软件许可证 1.0'
    },
    keyword: 'BSL-1.0',
    description: {
      en: 'Minimalist permissive license designed for C++ libraries, no need to retain license text.',
      zh: '极简的宽松许可证，专为C++库设计，无需保留许可证文本。'
    },
    permissiveness: 9,
    category: 'permissive',
    pros: {
      en: ['Extremely simple', 'No file requirements', 'C++ friendly', 'Header-file friendly'],
      zh: ['极其简单', '无文件要求', 'C++友好', '头文件友好']
    },
    cons: {
      en: ['Lower visibility', 'No patent protection'],
      zh: ['知名度较低', '无专利保护']
    },
    bestFor: {
      en: ['C++ libraries', 'Header-only libraries', 'Boost projects'],
      zh: ['C++库', '头文件库', 'Boost项目']
    },
    notRecommendedFor: {
      en: ['Projects requiring patent protection', 'Large applications'],
      zh: ['需要专利保护的项目', '大型应用']
    }
  },
  'BSD-3-Clause-Clear': {
    name: {
      en: 'BSD 3-Clause Clear License',
      zh: 'BSD 3条款明确许可证'
    },
    keyword: 'BSD-3-Clause-Clear',
    description: {
      en: 'Clear version of BSD 3-Clause, explicitly stating no patent rights are granted.',
      zh: 'BSD 3条款的明确版本，显式声明不授予专利权。'
    },
    permissiveness: 7,
    category: 'permissive',
    pros: {
      en: ['Clear patent terms', 'Simple and understandable', 'Business-friendly'],
      zh: ['明确的专利条款', '简单易懂', '商业友好']
    },
    cons: {
      en: ['Explicitly excludes patents', 'May limit certain uses'],
      zh: ['明确排除专利', '可能限制某些用途']
    },
    bestFor: {
      en: ['Projects requiring clear patent stance', 'Academic research'],
      zh: ['需要明确专利立场的项目', '学术研究']
    },
    notRecommendedFor: {
      en: ['Projects requiring patent protection'],
      zh: ['需要专利保护的项目']
    }
  },
  'BSD-4-Clause': {
    name: {
      en: 'BSD 4-Clause License',
      zh: 'BSD 4条款许可证'
    },
    keyword: 'BSD-4-Clause',
    description: {
      en: 'Original BSD license including advertising clause, now rarely used.',
      zh: '原始BSD许可证，包含广告条款，现已较少使用。'
    },
    permissiveness: 6,
    category: 'permissive',
    pros: {
      en: ['Historical significance', 'Clear attribution requirements'],
      zh: ['历史意义', '明确的归属要求']
    },
    cons: {
      en: ['Advertising clause burden', 'GPL incompatible', 'Outdated'],
      zh: ['广告条款负担', '与GPL不兼容', '已过时']
    },
    bestFor: {
      en: ['Historical projects', 'Specific attribution needs'],
      zh: ['历史项目', '特定归属需求']
    },
    notRecommendedFor: {
      en: ['Modern projects', 'Projects requiring GPL compatibility'],
      zh: ['现代项目', '需要GPL兼容的项目']
    }
  },
  '0BSD': {
    name: {
      en: 'BSD Zero Clause License',
      zh: 'BSD 零条款许可证'
    },
    keyword: '0BSD',
    description: {
      en: 'Zero-clause BSD license, close to public domain with no requirements.',
      zh: '零条款BSD许可证，接近公有领域，无任何要求。'
    },
    permissiveness: 10,
    category: 'public-domain',
    pros: {
      en: ['Complete freedom', 'No requirements', 'Extremely simple'],
      zh: ['完全自由', '无任何要求', '极其简单']
    },
    cons: {
      en: ['No legal protection', 'Potential risks'],
      zh: ['无法律保护', '可能存在风险']
    },
    bestFor: {
      en: ['Example code', 'Tutorial projects', 'Personal experiments'],
      zh: ['示例代码', '教程项目', '个人实验']
    },
    notRecommendedFor: {
      en: ['Commercial projects', 'Projects requiring attribution'],
      zh: ['商业项目', '需要归属的项目']
    }
  },
  'CC': {
    name: {
      en: 'Creative Commons License Family',
      zh: '知识共享许可证家族'
    },
    keyword: 'CC',
    description: {
      en: 'Creative Commons license family, mainly for creative works, not recommended for software.',
      zh: '创作共用许可证家族，主要用于创意作品，不推荐用于软件。'
    },
    permissiveness: 5,
    category: 'other',
    pros: {
      en: ['Creative-friendly', 'Multiple options', 'International recognition'],
      zh: ['创意友好', '多种选择', '国际认可']
    },
    cons: {
      en: ['Not suitable for software', 'May cause confusion'],
      zh: ['不适合软件', '可能造成混淆']
    },
    bestFor: {
      en: ['Documentation', 'Artistic works', 'Educational resources'],
      zh: ['文档', '艺术作品', '教育资源']
    },
    notRecommendedFor: {
      en: ['Software code', 'Technical projects'],
      zh: ['软件代码', '技术项目']
    }
  },
  'CC-BY-4.0': {
    name: {
      en: 'Creative Commons Attribution 4.0',
      zh: '知识共享署名 4.0'
    },
    keyword: 'CC-BY-4.0',
    description: {
      en: 'Creative Commons Attribution license requiring attribution but allowing any use.',
      zh: '创作共用署名许可证，要求署名但允许任何用途。'
    },
    permissiveness: 8,
    category: 'permissive',
    pros: {
      en: ['Allows commercial use', 'Only requires attribution', 'International standard'],
      zh: ['允许商业使用', '只需署名', '国际标准']
    },
    cons: {
      en: ['Mainly for content', 'Not suitable for code'],
      zh: ['主要用于内容', '不适合代码']
    },
    bestFor: {
      en: ['Documentation', 'Datasets', 'Educational content'],
      zh: ['文档', '数据集', '教育内容']
    },
    notRecommendedFor: {
      en: ['Software code', 'Technical libraries'],
      zh: ['软件代码', '技术库']
    }
  },
  'CC-BY-SA-4.0': {
    name: {
      en: 'Creative Commons Attribution ShareAlike 4.0',
      zh: '知识共享署名-相同方式共享 4.0'
    },
    keyword: 'CC-BY-SA-4.0',
    description: {
      en: 'Creative Commons Attribution ShareAlike license requiring derivative works to use the same license.',
      zh: '创作共用署名-相同方式共享许可证，要求衍生作品使用相同许可证。'
    },
    permissiveness: 6,
    category: 'copyleft',
    pros: {
      en: ['Protects openness', 'Requires contribution back', 'Suitable for content'],
      zh: ['保护开放性', '要求回馈', '适合内容']
    },
    cons: {
      en: ['Not suitable for software', 'Copyleft requirements'],
      zh: ['不适合软件', 'copyleft要求']
    },
    bestFor: {
      en: ['Wiki projects', 'Educational resources', 'Open content'],
      zh: ['维基项目', '教育资源', '开放内容']
    },
    notRecommendedFor: {
      en: ['Software code', 'Commercial software'],
      zh: ['软件代码', '商业软件']
    }
  },
  'ECL-2.0': {
    name: {
      en: 'Educational Community License v2.0',
      zh: '教育社区许可证 v2.0'
    },
    keyword: 'ECL-2.0',
    description: {
      en: 'Educational Community License based on Apache 2.0, designed specifically for educational institutions.',
      zh: '教育社区许可证，基于Apache 2.0，专为教育机构设计。'
    },
    permissiveness: 8,
    category: 'permissive',
    pros: {
      en: ['Education-friendly', 'Based on Apache 2.0', 'Patent protection'],
      zh: ['教育友好', '基于Apache 2.0', '专利保护']
    },
    cons: {
      en: ['Lower visibility', 'Mainly for education'],
      zh: ['知名度较低', '主要用于教育']
    },
    bestFor: {
      en: ['Educational software', 'Academic projects', 'Research tools'],
      zh: ['教育软件', '学术项目', '研究工具']
    },
    notRecommendedFor: {
      en: ['Commercial projects', 'Consumer software'],
      zh: ['商业项目', '消费级软件']
    }
  },
  'EPL-1.0': {
    name: {
      en: 'Eclipse Public License 1.0',
      zh: 'Eclipse 公共许可证 1.0'
    },
    keyword: 'EPL-1.0',
    description: {
      en: 'First version of Eclipse Public License, enterprise-friendly weak copyleft license.',
      zh: '第一版Eclipse公共许可证，企业友好的弱copyleft许可证。'
    },
    permissiveness: 6,
    category: 'weak-copyleft',
    pros: {
      en: ['Enterprise-friendly', 'Weak copyleft', 'Patent protection'],
      zh: ['企业友好', '弱copyleft', '专利保护']
    },
    cons: {
      en: ['GPL incompatible', 'Superseded by EPL-2.0'],
      zh: ['与GPL不兼容', '已被EPL-2.0取代']
    },
    bestFor: {
      en: ['Eclipse projects', 'Enterprise open source', 'Java projects'],
      zh: ['Eclipse项目', '企业开源', 'Java项目']
    },
    notRecommendedFor: {
      en: ['New projects', 'Projects requiring GPL compatibility'],
      zh: ['新项目', '需要GPL兼容的项目']
    }
  },
  'EUPL-1.1': {
    name: {
      en: 'European Union Public License 1.1',
      zh: '欧盟公共许可证 1.1'
    },
    keyword: 'EUPL-1.1',
    description: {
      en: 'European Union Public License, copyleft license designed under EU legal framework.',
      zh: '欧盟公共许可证，copyleft许可证，在欧盟法律框架下设计。'
    },
    permissiveness: 5,
    category: 'copyleft',
    pros: {
      en: ['EU official', 'Multi-language versions', 'Copyleft protection'],
      zh: ['欧盟官方', '多语言版本', 'copyleft保护']
    },
    cons: {
      en: ['Strong regional focus', 'Lower visibility'],
      zh: ['地域性强', '知名度较低']
    },
    bestFor: {
      en: ['EU projects', 'Government software', 'Public sector'],
      zh: ['欧盟项目', '政府软件', '公共部门']
    },
    notRecommendedFor: {
      en: ['Global projects', 'Commercial software'],
      zh: ['全球项目', '商业软件']
    }
  },
  'GPL': {
    name: {
      en: 'GNU General Public License Family',
      zh: 'GNU 通用公共许可证家族'
    },
    keyword: 'GPL',
    description: {
      en: 'GNU General Public License family, representative of strong copyleft licenses.',
      zh: 'GNU通用公共许可证家族，强copyleft许可证的代表。'
    },
    permissiveness: 3,
    category: 'copyleft',
    pros: {
      en: ['Enforces open source', 'Protects freedom', 'Widely used'],
      zh: ['强制开源', '保护自由', '广泛使用']
    },
    cons: {
      en: ['Commercial restrictions', 'Complex compliance'],
      zh: ['商业限制', '复杂合规']
    },
    bestFor: {
      en: ['Free software', 'Open source projects', 'Community projects'],
      zh: ['自由软件', '开源项目', '社区项目']
    },
    notRecommendedFor: {
      en: ['Commercial products', 'Proprietary integration'],
      zh: ['商业产品', '专有集成']
    }
  },
  'LGPL-2.1': {
    name: {
      en: 'GNU Lesser General Public License v2.1',
      zh: 'GNU 宽松通用公共许可证 v2.1'
    },
    keyword: 'LGPL-2.1',
    description: {
      en: 'Older version of LGPL, weak copyleft license allowing linking to proprietary software.',
      zh: '较旧版本的LGPL，弱copyleft许可证，允许链接到专有软件。'
    },
    permissiveness: 6,
    category: 'weak-copyleft',
    pros: {
      en: ['Allows commercial linking', 'Library-friendly', 'Mature and stable'],
      zh: ['允许商业链接', '库友好', '成熟稳定']
    },
    cons: {
      en: ['Older version', 'Complex compliance'],
      zh: ['版本较旧', '复杂合规']
    },
    bestFor: {
      en: ['Legacy libraries', 'System libraries', 'C libraries'],
      zh: ['传统库', '系统库', 'C库']
    },
    notRecommendedFor: {
      en: ['New projects', 'Applications'],
      zh: ['新项目', '应用程序']
    }
  },
  'LGPL': {
    name: {
      en: 'GNU Lesser General Public License Family',
      zh: 'GNU 宽松通用公共许可证家族'
    },
    keyword: 'LGPL',
    description: {
      en: 'GNU Lesser General Public License family, weak copyleft license.',
      zh: 'GNU宽松通用公共许可证家族，弱copyleft许可证。'
    },
    permissiveness: 6,
    category: 'weak-copyleft',
    pros: {
      en: ['Library-friendly', 'Allows commercial linking', 'Balances openness and commercial use'],
      zh: ['库友好', '允许商业链接', '平衡开放与商用']
    },
    cons: {
      en: ['Complex compliance', 'Dynamic linking requirements'],
      zh: ['复杂合规', '动态链接要求']
    },
    bestFor: {
      en: ['Software libraries', 'Middleware', 'Frameworks'],
      zh: ['软件库', '中间件', '框架']
    },
    notRecommendedFor: {
      en: ['Applications', 'Simple tools'],
      zh: ['应用程序', '简单工具']
    }
  },
  'LPPL-1.3c': {
    name: {
      en: 'LaTeX Project Public License v1.3c',
      zh: 'LaTeX 项目公共许可证 v1.3c'
    },
    keyword: 'LPPL-1.3c',
    description: {
      en: 'LaTeX Project Public License designed specifically for LaTeX and related projects.',
      zh: 'LaTeX项目公共许可证，专为LaTeX和相关项目设计。'
    },
    permissiveness: 7,
    category: 'permissive',
    pros: {
      en: ['LaTeX-specific', 'Allows modifications', 'Academic-friendly'],
      zh: ['LaTeX专用', '允许修改', '学术友好']
    },
    cons: {
      en: ['Domain-specific', 'Complex terms'],
      zh: ['特定领域', '复杂条款']
    },
    bestFor: {
      en: ['LaTeX packages', 'Typesetting tools', 'Academic publishing'],
      zh: ['LaTeX包', '排版工具', '学术出版']
    },
    notRecommendedFor: {
      en: ['General software', 'Commercial applications'],
      zh: ['通用软件', '商业应用']
    }
  },
  'MS-PL': {
    name: {
      en: 'Microsoft Public License',
      zh: '微软公共许可证'
    },
    keyword: 'MS-PL',
    description: {
      en: 'Microsoft Public License, permissive open source license allowing commercial use.',
      zh: '微软公共许可证，宽松的开源许可证，允许商业使用。'
    },
    permissiveness: 8,
    category: 'permissive',
    pros: {
      en: ['Microsoft official', 'Business-friendly', 'Patent protection'],
      zh: ['微软官方', '商业友好', '专利保护']
    },
    cons: {
      en: ['Lower visibility', 'Microsoft-specific'],
      zh: ['知名度较低', '微软特色']
    },
    bestFor: {
      en: ['Microsoft ecosystem', '.NET projects', 'Enterprise software'],
      zh: ['微软生态', '.NET项目', '企业软件']
    },
    notRecommendedFor: {
      en: ['Cross-platform projects', 'Open source community projects'],
      zh: ['跨平台项目', '开源社区项目']
    }
  },
  'NCSA': {
    name: {
      en: 'University of Illinois/NCSA Open Source License',
      zh: '伊利诺伊大学/NCSA 开源许可证'
    },
    keyword: 'NCSA',
    description: {
      en: 'University of Illinois/NCSA Open Source License, similar to BSD but includes patent clauses.',
      zh: '伊利诺伊大学/NCSA开源许可证，类似BSD但包含专利条款。'
    },
    permissiveness: 8,
    category: 'permissive',
    pros: {
      en: ['Academic background', 'Patent protection', 'Business-friendly'],
      zh: ['学术背景', '专利保护', '商业友好']
    },
    cons: {
      en: ['Lower visibility', 'Institution-specific'],
      zh: ['知名度较低', '特定机构']
    },
    bestFor: {
      en: ['Academic projects', 'Research software', 'University projects'],
      zh: ['学术项目', '研究软件', '大学项目']
    },
    notRecommendedFor: {
      en: ['Commercial products', 'Consumer software'],
      zh: ['商业产品', '消费级软件']
    }
  },
  'OFL-1.1': {
    name: {
      en: 'SIL Open Font License 1.1',
      zh: 'SIL 开放字体许可证 1.1'
    },
    keyword: 'OFL-1.1',
    description: {
      en: 'SIL Open Font License designed specifically for fonts, allows embedding and modification.',
      zh: 'SIL开放字体许可证，专为字体设计，允许嵌入和修改。'
    },
    permissiveness: 7,
    category: 'permissive',
    pros: {
      en: ['Font-specific', 'Allows embedding', 'Business-friendly'],
      zh: ['字体专用', '允许嵌入', '商业友好']
    },
    cons: {
      en: ['Font-only', 'Special requirements'],
      zh: ['仅适用字体', '特殊要求']
    },
    bestFor: {
      en: ['Font projects', 'Typography software', 'Design tools'],
      zh: ['字体项目', '排版软件', '设计工具']
    },
    notRecommendedFor: {
      en: ['General software', 'Non-font projects'],
      zh: ['通用软件', '非字体项目']
    }
  },
  'OSL-3.0': {
    name: {
      en: 'Open Software License 3.0',
      zh: '开放软件许可证 3.0'
    },
    keyword: 'OSL-3.0',
    description: {
      en: 'Open Software License, copyleft license requiring source code distribution.',
      zh: '开放软件许可证，copyleft许可证，要求分发源代码。'
    },
    permissiveness: 4,
    category: 'copyleft',
    pros: {
      en: ['Enforces open source', 'Patent protection', 'Network use coverage'],
      zh: ['强制开源', '专利保护', '网络使用覆盖']
    },
    cons: {
      en: ['Commercial restrictions', 'Complex compliance'],
      zh: ['商业限制', '复杂合规']
    },
    bestFor: {
      en: ['Open source projects', 'Community software', 'Academic research'],
      zh: ['开源项目', '社区软件', '学术研究']
    },
    notRecommendedFor: {
      en: ['Commercial products', 'SaaS services'],
      zh: ['商业产品', 'SaaS服务']
    }
  },
  'PostgreSQL': {
    name: {
      en: 'PostgreSQL License',
      zh: 'PostgreSQL 许可证'
    },
    keyword: 'PostgreSQL',
    description: {
      en: 'PostgreSQL License, similar to MIT, extremely permissive and concise.',
      zh: 'PostgreSQL许可证，类似MIT，极其宽松且简洁。'
    },
    permissiveness: 9,
    category: 'permissive',
    pros: {
      en: ['Extremely permissive', 'Database-friendly', 'Business-friendly'],
      zh: ['极其宽松', '数据库友好', '商业友好']
    },
    cons: {
      en: ['Lower visibility', 'No patent protection'],
      zh: ['知名度较低', '无专利保护']
    },
    bestFor: {
      en: ['Database projects', 'System software', 'Server software'],
      zh: ['数据库项目', '系统软件', '服务器软件']
    },
    notRecommendedFor: {
      en: ['Projects requiring patent protection'],
      zh: ['需要专利保护的项目']
    }
  },
  'Zlib': {
    name: {
      en: 'zLib License',
      zh: 'zLib 许可证'
    },
    keyword: 'Zlib',
    description: {
      en: 'zLib License, permissive license allowing modifications but requiring acknowledgment of changes.',
      zh: 'zLib许可证，宽松许可证，允许修改但要求标明修改。'
    },
    permissiveness: 8,
    category: 'permissive',
    pros: {
      en: ['Simple and clear', 'Allows modifications', 'Business-friendly'],
      zh: ['简单明了', '允许修改', '商业友好']
    },
    cons: {
      en: ['Requires acknowledgment of changes', 'Lower visibility'],
      zh: ['要求标明修改', '知名度较低']
    },
    bestFor: {
      en: ['Compression libraries', 'System tools', 'C/C++ projects'],
      zh: ['压缩库', '系统工具', 'C/C++项目']
    },
    notRecommendedFor: {
      en: ['Projects requiring hidden modifications'],
      zh: ['需要隐藏修改的项目']
    }
  },
  'No License': {
    name: {
      en: 'No License',
      zh: '无许可证'
    },
    keyword: 'No License',
    description: {
      en: 'No license specified, all rights reserved by default, others cannot legally use.',
      zh: '未指定许可证，默认保留所有权利，他人无法合法使用。'
    },
    permissiveness: 0,
    category: 'proprietary',
    pros: {
      en: ['Retains all rights', 'Complete control'],
      zh: ['保留所有权利', '完全控制']
    },
    cons: {
      en: ['Others cannot contribute', 'Cannot be legally used', 'Hinders collaboration'],
      zh: ['他人无法贡献', '无法合法使用', '阻碍协作']
    },
    bestFor: {
      en: ['Private projects', 'Trade secrets', 'Unfinished projects'],
      zh: ['私有项目', '商业秘密', '未完成项目']
    },
    notRecommendedFor: {
      en: ['Open source projects', 'Collaborative projects', 'Public sharing'],
      zh: ['开源项目', '协作项目', '公开分享']
    }
  }
}

export default function Home() {
  const [language, setLanguage] = useState<Language>('en')
  const [isMobile, setIsMobile] = useState(false)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [allRepos, setAllRepos] = useState<Repository[]>([])
  const [filteredLicenseData, setFilteredLicenseData] = useState<LicenseData>({})
  const [error, setError] = useState('')
  const [includeForks, setIncludeForks] = useState(false)
  const [includeNoLicense, setIncludeNoLicense] = useState(false)
  const [preferences, setPreferences] = useState<LicensePreference[]>([])
  const [dataFetched, setDataFetched] = useState(false)

  const t = I18N[language]

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchAllRepositories = async () => {
    if (!username.trim()) {
      setError(t.userNotFound)
      return
    }

    setLoading(true)
    setError('')
    setAllRepos([])
    setDataFetched(false)

    try {
      let page = 1
      let repos: Repository[] = []
      let hasMore = true

      while (hasMore) {
        const response = await axios.get(
          `https://api.github.com/users/${username}/repos?page=${page}&per_page=100`
        )
        
        if (response.data.length === 0) {
          hasMore = false
        } else {
          repos = [...repos, ...response.data]
          page++
        }
      }

      setAllRepos(repos)
      setDataFetched(true)
      generateLicensePreferences(repos)
    } catch (err: unknown) {
      const axiosError = err as { response?: { status: number } }
      if (axiosError.response?.status === 404) {
        setError(t.userNotFound)
      } else {
        setError(t.fetchError)
      }
    } finally {
      setLoading(false)
    }
  }

  const filterRepositories = () => {
    const filteredRepos = includeForks ? allRepos : allRepos.filter(repo => !repo.fork)
    
    const licenses: LicenseData = {}
    
    filteredRepos.forEach((repo: Repository) => {
      const licenseName = repo.license?.name || 'No License'
      if (!licenses[licenseName]) {
        licenses[licenseName] = []
      }
      licenses[licenseName].push(repo)
    })

    setFilteredLicenseData(licenses)
  }

  const generateLicensePreferences = (repos: Repository[]) => {
    const licenseStats: { [key: string]: { count: number, stars: number } } = {}
    
    repos.forEach(repo => {
      const licenseName = repo.license?.name || 'No License'
      if (!licenseStats[licenseName]) {
        licenseStats[licenseName] = { count: 0, stars: 0 }
      }
      licenseStats[licenseName].count++
      licenseStats[licenseName].stars += repo.stargazers_count || 0
    })

    const totalRepos = repos.filter(repo => repo.license?.name).length
    const prefs: LicensePreference[] = Object.entries(licenseStats)
      .filter(([license]) => license !== 'No License')
      .map(([license, stats]) => {
        const avgStars = stats.count > 0 ? stats.stars / stats.count : 0
        const usage = stats.count / totalRepos
        
        const countWeight = Math.pow(stats.count, 1.5) / Math.pow(totalRepos, 1.5)
        const usageWeight = usage * 0.8
        
        const score = Math.min(100, Math.round((usageWeight * 80) + (countWeight * 20)))
        
        return {
          license,
          score,
          reason: getLicenseReason(license, usage, avgStars, stats.count),
          recommendation: getLicenseRecommendation(license, score)
        }
      })
      .sort((a, b) => b.score - a.score)

    setPreferences(prefs)
  }

  const getPermissivenessAnalysis = (): string => {
    if (preferences.length === 0) return ''
    
    const permissivenessLevels = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0 
    }
    
    let totalWeight = 0
    let weightedPermissiveness = 0
    
    preferences.forEach(pref => {
      const licenseInfo = getLicenseInfo(pref.license)
      if (licenseInfo) {
         const weight = Math.pow(pref.score / 100, 2) * preferences.length
         weightedPermissiveness += licenseInfo.permissiveness * weight
         totalWeight += weight
        
        if (licenseInfo.permissiveness <= 2) permissivenessLevels.level1 += weight
        else if (licenseInfo.permissiveness <= 4) permissivenessLevels.level2 += weight
        else if (licenseInfo.permissiveness <= 6) permissivenessLevels.level3 += weight
        else if (licenseInfo.permissiveness <= 8) permissivenessLevels.level4 += weight
        else permissivenessLevels.level5 += weight
      }
    })
    
    const avgPermissiveness = totalWeight > 0 ? weightedPermissiveness / totalWeight : 0
    
    const maxLevel = Object.entries(permissivenessLevels)
      .reduce((max, [level, weight]) => weight > max.weight ? {level, weight} : max, {level: '', weight: 0})
    
    if (avgPermissiveness >= 9) {
      return t.extremelyPermissive
    } else if (avgPermissiveness >= 7.5) {
      return t.highlyPermissive
    } else if (avgPermissiveness >= 6) {
      return t.moderatelyPermissive
    } else if (avgPermissiveness >= 4.5) {
      return t.moderatelyRestrictive
    } else if (avgPermissiveness >= 3) {
      return t.strictCopyleft
    } else if (avgPermissiveness >= 1.5) {
      return t.veryStrict
    } else {
      return t.extremelyConservative
    }
  }

  const getLicenseReason = (license: string, usage: number, avgStars: number, count: number): string => {
    const usagePercent = Math.round(usage * 100)
    if (usagePercent > 50) {
      return t.strongPreference.replace('{percent}', usagePercent.toString()).replace('{count}', count.toString())
    } else if (avgStars > 50) {
      return t.highQuality.replace('{count}', count.toString()).replace('{stars}', Math.round(avgStars).toString())
    } else if (count >= 3) {
      return t.frequentUse.replace('{count}', count.toString()).replace('{percent}', usagePercent.toString())
    } else {
      return t.moderateUse.replace('{percent}', usagePercent.toString()).replace('{count}', count.toString())
    }
  }

  const getLicenseRecommendation = (license: string, score: number): string => {
    if (score > 80) {
      return t.stronglyRecommended
    } else if (score > 60) {
      return t.recommended
    } else if (score > 40) {
      return t.considerUse
    } else {
      return t.specificScenarios
    }
  }

  const getLicenseInfo = (licenseName: string): LicenseInfo | null => {
    const licenseNameMap: { [key: string]: string } = {
      'GNU General Public License v3.0': 'GPL-3.0',
      'GNU General Public License v2.0': 'GPL-2.0',
      'GNU Lesser General Public License v3.0': 'LGPL-3.0',
      'GNU Lesser General Public License v2.1': 'LGPL-2.1',
      'GNU Affero General Public License v3.0': 'AGPL-3.0',
      'GNU General Public License family': 'GPL',
      'GNU Lesser General Public License family': 'LGPL',
      
      'Apache License 2.0': 'Apache-2.0',
      'Apache license 2.0': 'Apache-2.0',
      'Apache-2.0': 'Apache-2.0',
      
      'MIT License': 'MIT',
      'MIT': 'MIT',
      
      'BSD 3-Clause "New" or "Revised" License': 'BSD-3-Clause',
      'BSD 2-Clause "Simplified" License': 'BSD-2-Clause',
      'BSD 3-Clause Clear License': 'BSD-3-Clause-Clear',
      'BSD 4-Clause "Original" or "Old" License': 'BSD-4-Clause',
      'BSD Zero Clause License': '0BSD',
      'BSD Zero-Clause license': '0BSD',
      '0BSD': '0BSD',
      
      'Mozilla Public License 2.0': 'MPL-2.0',
      'MPL-2.0': 'MPL-2.0',
      
      'Academic Free License v3.0': 'AFL-3.0',
      'AFL-3.0': 'AFL-3.0',
      'Artistic License 2.0': 'Artistic-2.0',
      'Artistic license 2.0': 'Artistic-2.0',
      'Artistic-2.0': 'Artistic-2.0',
      'Boost Software License 1.0': 'BSL-1.0',
      'BSL-1.0': 'BSL-1.0',
      'Educational Community License v2.0': 'ECL-2.0',
      'ECL-2.0': 'ECL-2.0',
      
      'Eclipse Public License 2.0': 'EPL-2.0',
      'Eclipse Public License 1.0': 'EPL-1.0',
      'EPL-1.0': 'EPL-1.0',
      'EPL-2.0': 'EPL-2.0',
      
      'Creative Commons Zero v1.0 Universal': 'CC0-1.0',
      'Creative Commons Attribution 4.0': 'CC-BY-4.0',
      'Creative Commons Attribution ShareAlike 4.0': 'CC-BY-SA-4.0',
      'Creative Commons license family': 'CC',
      'CC0-1.0': 'CC0-1.0',
      'CC-BY-4.0': 'CC-BY-4.0',
      'CC-BY-SA-4.0': 'CC-BY-SA-4.0',
      'CC': 'CC',
      
      'European Union Public License 1.1': 'EUPL-1.1',
      'EUPL-1.1': 'EUPL-1.1',
      
      'Microsoft Public License': 'MS-PL',
      'MS-PL': 'MS-PL',
      
      'The Unlicense': 'Unlicense',
      'Unlicense': 'Unlicense',
      'ISC License': 'ISC',
      'ISC': 'ISC',
      'Do What The F*ck You Want To Public License': 'WTFPL',
      'WTFPL': 'WTFPL',
      'Open Software License 3.0': 'OSL-3.0',
      'OSL-3.0': 'OSL-3.0',
      'PostgreSQL License': 'PostgreSQL',
      'PostgreSQL': 'PostgreSQL',
      'SIL Open Font License 1.1': 'OFL-1.1',
      'OFL-1.1': 'OFL-1.1',
      'University of Illinois/NCSA Open Source License': 'NCSA',
      'NCSA': 'NCSA',
      'zLib License': 'Zlib',
      'Zlib': 'Zlib',
      'LaTeX Project Public License v1.3c': 'LPPL-1.3c',
      'LPPL-1.3c': 'LPPL-1.3c'
    }
    
    if (LICENSE_DATABASE[licenseName]) {
      return LICENSE_DATABASE[licenseName]
    }
    
    const mappedName = licenseNameMap[licenseName]
    if (mappedName && LICENSE_DATABASE[mappedName]) {
      return LICENSE_DATABASE[mappedName]
    }
    
    return null
  }

  const getPermissivenessColor = (permissiveness: number): string => {
    if (permissiveness >= 8) return '#52c41a' 
    if (permissiveness >= 6) return '#1890ff'
    if (permissiveness >= 4) return '#faad14'
    if (permissiveness >= 2) return '#f5222d'
    return '#722ed1'
  }

  const getPermissivenessText = (permissiveness: number): string => {
    if (permissiveness >= 8) return t.veryPermissive
    if (permissiveness >= 6) return t.moderatelyPermissiveLevel
    if (permissiveness >= 4) return t.moderateRestriction
    if (permissiveness >= 2) return t.strictRestriction
    return t.proprietaryRestricted
  }

  useEffect(() => {
    if (dataFetched) {
      filterRepositories()
      const filteredRepos = includeForks ? allRepos : allRepos.filter(repo => !repo.fork)
      const reposToAnalyze = includeNoLicense ? filteredRepos : filteredRepos.filter(repo => repo.license?.name)
      generateLicensePreferences(reposToAnalyze)
    }
  }, [includeForks, includeNoLicense, allRepos, dataFetched])

  const getSortedLicenses = () => {
    const entries = Object.entries(filteredLicenseData)
    let filtered = includeNoLicense ? entries : entries.filter(([license]) => license !== 'No License')
    
    const withoutNoLicense = filtered.filter(([license]) => license !== 'No License')
    const noLicense = filtered.filter(([license]) => license === 'No License')
    
    withoutNoLicense.sort(([,a], [,b]) => b.length - a.length)
    
    return [...withoutNoLicense, ...noLicense]
  }

  const sortedLicenses = getSortedLicenses()
  
  const getChartData = () => {
    const sortedLicenses = getSortedLicenses()
    const totalRepos = sortedLicenses.reduce((sum, [, repos]) => sum + repos.length, 0)
    
    const data = sortedLicenses.map(([, repos]) => ((repos.length / totalRepos) * 100).toFixed(1))
    const labels = sortedLicenses.map(([license]) => license)
    
    return {
      labels: [''],
      datasets: sortedLicenses.map(([license, repos], index) => ({
        label: license,
        data: [((repos.length / totalRepos) * 100).toFixed(1)],
        backgroundColor: [
          '#FF6384',
          '#36A2EB', 
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#C9CBCF',
          '#8E44AD',
          '#E67E22',
          '#2ECC71'
        ][index % 10],
        borderWidth: 1,
      }))
    }
  }

  const chartData = getChartData()
  const totalRepos = sortedLicenses.reduce((sum, [, repos]) => sum + repos.length, 0)

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 8
        }
      },

      tooltip: {
        callbacks: {
          label: function(context: { dataset: { label: string }, parsed: { y: number } }) {
            return `${context.dataset.label}: ${context.parsed.y}%`
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: t.percentageAxis
        },
        ticks: {
          callback: function(value: string | number) {
            return value + '%'
          }
        }
      },
      y: {
        stacked: true,
        display: true,
        ticks: {
          display: false
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <Select
              value={language}
              onChange={setLanguage}
              className="w-32"
              style={{ 
                border: '1px solid #d1d5db', 
                borderRadius: '6px', 
                backgroundColor: '#ffffff',
                minHeight: '32px',
                display: 'flex',
                alignItems: 'center'
              }}
              suffixIcon={<GlobalOutlined />}
            >
              <Select.Option value="en">English</Select.Option>
              <Select.Option value="zh">中文</Select.Option>
            </Select>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            {t.title}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            {t.subtitle}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
                <div className="flex-1">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.usernameLabel}
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchAllRepositories()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    placeholder={t.usernamePlaceholder}
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={fetchAllRepositories}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loading ? t.analyzingButton : t.analyzeButton}
                </button>
              </div>
              
              {dataFetched && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeForks"
                      checked={includeForks}
                      onChange={(e) => setIncludeForks(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="includeForks" className="text-xs sm:text-sm text-gray-700">
                      {t.includeForks}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeNoLicense"
                      checked={includeNoLicense}
                      onChange={(e) => setIncludeNoLicense(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="includeNoLicense" className="text-xs sm:text-sm text-gray-700">
                      {t.includeNoLicense}
                    </label>
                  </div>
                </div>
              )}
            </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {dataFetched && Object.keys(filteredLicenseData).length > 0 && (
          <>
            {preferences.length > 0 && (
              <Card 
                title={<><StarOutlined /> {t.licensePreferenceAnalysis}</>} 
                style={{ marginBottom: '16px' }}
                className="shadow-sm"
              >
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Title level={4} style={{ margin: 0, color: '#1890ff', fontSize: '16px' }}>
                    {getPermissivenessAnalysis()}
                  </Title>
                </div>
                <div style={{ width: '100%', height: isMobile ? '240px' : '180px' }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </Card>
            )}

            <Card title={<><BarChartOutlined /> {t.statistics}</>} style={{ marginBottom: '16px' }} className="shadow-sm">
              <div style={{ marginBottom: '12px' }}>
                <Title level={5} style={{ fontSize: '14px', marginBottom: '8px' }}>{t.repositoryDetails}</Title>
                <Paragraph style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <Text strong>{t.total}</Text> {totalRepos} {t.repos}
                  {!includeForks && <Text type="secondary"> {t.forksExcluded}</Text>}
                  {!includeNoLicense && <Text type="secondary"> {t.noLicenseExcluded}</Text>}
                </Paragraph>
              </div>
                  
                  <Collapse
                    items={getSortedLicenses().map(([license, repos]) => {
                      const licenseInfo = getLicenseInfo(license)
                      const percentage = Math.round((repos.length / totalRepos) * 100)
                      
                      return {
                        key: license,
                        label: (
                          <div className="ant-collapse-header-text">
                            <div>
                              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                {license}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>{repos.length} repos</Tag>
                              <Tag color="green" style={{ fontSize: '11px', margin: 0 }}>{percentage}%</Tag>
                              {licenseInfo && (
                                <Tag color={getPermissivenessColor(licenseInfo.permissiveness)} style={{ fontSize: '11px', margin: 0 }}>
                                  {licenseInfo.permissiveness}/10
                                </Tag>
                              )}
                            </div>
                          </div>
                        ),
                        children: (
                          <div>
                            {licenseInfo && (
                              <Card 
                                size="small" 
                                style={{ marginBottom: '16px', background: '#fafafa' }}
                                title={
                                  <Space>
                                    <InfoCircleOutlined />
                                    <span>{t.licenseDetails}</span>
                                    <Badge 
                                      color={getPermissivenessColor(licenseInfo.permissiveness)}
                                      text={getPermissivenessText(licenseInfo.permissiveness)}
                                    />
                                  </Space>
                                }
                              >
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                  <div>
                                    <Title level={5} style={{ margin: 0, marginBottom: '8px' }}>{t.description}</Title>
                                    <Paragraph style={{ margin: 0 }}>{typeof licenseInfo.description === 'object' && licenseInfo.description[language] ? licenseInfo.description[language] : licenseInfo.description}</Paragraph>
                                  </div>
                                  
                                  <div>
                                    <Title level={5} style={{ margin: 0, marginBottom: '8px' }}>{t.permissivenessLevel}</Title>
                                    <Progress 
                                      percent={licenseInfo.permissiveness * 10} 
                                      strokeColor={getPermissivenessColor(licenseInfo.permissiveness)}
                                      format={() => `${licenseInfo.permissiveness}/10`}
                                    />
                                  </div>
                                  
                                  <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={12}>
                                      <Title level={5} style={{ margin: 0, marginBottom: '8px', color: '#52c41a' }}>
                                        <CheckCircleOutlined /> {t.advantages}
                                      </Title>
                                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                        {(typeof licenseInfo.pros === 'object' && licenseInfo.pros[language] ? licenseInfo.pros[language] : licenseInfo.pros).map((pro, index) => (
                                          <li key={index} style={{ marginBottom: '4px' }}>{pro}</li>
                                        ))}
                                      </ul>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                      <Title level={5} style={{ margin: 0, marginBottom: '8px', color: '#f5222d' }}>
                                        <CloseCircleOutlined /> {t.disadvantages}
                                      </Title>
                                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                        {(typeof licenseInfo.cons === 'object' && licenseInfo.cons[language] ? licenseInfo.cons[language] : licenseInfo.cons).map((con, index) => (
                                          <li key={index} style={{ marginBottom: '4px' }}>{con}</li>
                                        ))}
                                      </ul>
                                    </Col>
                                  </Row>
                                  
                                  <Row gutter={[16, 16]}>
                                    <Col xs={24} sm={12}>
                                      <Title level={5} style={{ margin: 0, marginBottom: '8px', color: '#1890ff' }}>{t.suitableFor}</Title>
                                      <div>
                                        {(typeof licenseInfo.bestFor === 'object' && licenseInfo.bestFor[language] ? licenseInfo.bestFor[language] : licenseInfo.bestFor).map((scenario, index) => (
                                          <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>{scenario}</Tag>
                                        ))}
                                      </div>
                                    </Col>
                                    <Col xs={24} sm={12}>
                                      <Title level={5} style={{ margin: 0, marginBottom: '8px', color: '#faad14' }}>{t.notRecommendedFor}</Title>
                                      <div>
                                        {(typeof licenseInfo.notRecommendedFor === 'object' && licenseInfo.notRecommendedFor[language] ? licenseInfo.notRecommendedFor[language] : licenseInfo.notRecommendedFor).map((scenario, index) => (
                                          <Tag key={index} color="orange" style={{ marginBottom: '4px' }}>{scenario}</Tag>
                                        ))}
                                      </div>
                                    </Col>
                                  </Row>
                                </Space>
                              </Card>
                            )}
                            
                            <Divider orientation="left">{t.repositoriesUsingLicense}</Divider>
                            
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                              {repos.map((repo: Repository) => (
                                <Card 
                                  key={repo.id} 
                                  size="small" 
                                  style={{ marginBottom: '8px' }}
                                  bodyStyle={{ padding: '12px' }}
                                >
                                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <Space wrap>
                                      <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }}>
                                        <LinkOutlined /> {repo.name}
                                      </a>
                                      {repo.fork && <Tag color="orange"><ForkOutlined /> Fork</Tag>}
                                      {repo.stargazers_count > 0 && (
                                        <Tag color="gold">
                                          <StarOutlined /> {repo.stargazers_count}
                                        </Tag>
                                      )}
                                      {repo.language && <Tag>{repo.language}</Tag>}
                                    </Space>
                                    {repo.description && (
                                      <Paragraph 
                                        style={{ margin: 0, color: '#666', fontSize: '13px' }}
                                        ellipsis={{ rows: 2, expandable: true }}
                                      >
                                        {repo.description}
                                      </Paragraph>
                                    )}
                                  </Space>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )
                      }
                    })}
                  />
            </Card>
          </>
        )}
      </div>
    </div>
  )
}