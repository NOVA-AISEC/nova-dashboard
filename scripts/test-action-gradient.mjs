import { readFile } from 'node:fs/promises'

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

async function main() {
  const [
    css,
    buttonVariants,
    opsPage,
    queuePage,
    alertsPage,
    casesPage,
    caseDetailPage,
  ] = await Promise.all([
    read('src/index.css'),
    read('src/components/ui/button-variants.ts'),
    read('src/pages/ops-page.tsx'),
    read('src/pages/queue-page.tsx'),
    read('src/pages/alerts-page.tsx'),
    read('src/pages/cases-page.tsx'),
    read('src/pages/case-detail-page.tsx'),
  ])

  const errors = []

  if (!css.includes('--nova-action-gradient')) {
    errors.push('Missing action-gradient CSS token.')
  }

  if (!buttonVariants.includes("action: 'btn-action'")) {
    errors.push('Button variants are missing the shared action variant.')
  }

  for (const [file, source] of Object.entries({
    'src/pages/ops-page.tsx': opsPage,
    'src/pages/queue-page.tsx': queuePage,
    'src/pages/alerts-page.tsx': alertsPage,
    'src/pages/cases-page.tsx': casesPage,
    'src/pages/case-detail-page.tsx': caseDetailPage,
  })) {
    if (/#EC7D30|#F25B29/i.test(source)) {
      errors.push(`${file} uses raw action-gradient hex values instead of shared tokens/components.`)
    }
  }

  if (errors.length) {
    for (const error of errors) {
      console.error(error)
    }
    process.exitCode = 1
    return
  }

  console.log('Action gradient smoke check passed.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
