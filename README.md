# SkillDrop

SkillDrop é uma plataforma web SaaS para estudantes criarem salas privadas, enviarem, organizarem, visualizarem e compartilharem atividades acadêmicas: PDFs, imagens, ZIPs, vídeos, documentos, códigos-fonte, links e projetos.

## Stack

- Next.js 15 App Router, React, TypeScript e TailwindCSS
- Componentes no padrão Shadcn/UI, Framer Motion e Lucide Icons
- Firebase Authentication, Firestore e Hosting
- Vercel Blob para armazenar arquivos compartilhaveis e privados
- OpenAI API com streaming em `/api/ai/chat`
- Monaco Editor, React Hook Form, Zod e Zustand
- Salas privadas por código ou link, com mensagens e anexos pequenos por sala

## Instalação

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

## Firebase

1. Crie um projeto no Firebase.
2. Ative Authentication com Email/Senha e Google.
3. Crie Firestore.
4. Preencha `.env.local` com as credenciais client e admin.
5. Publique regras e índices:

```bash
firebase deploy --only firestore:rules,firestore:indexes --project skilldrop-78a68
```

## Uploads com Vercel Blob

O SkillDrop nao usa Firebase Storage. Arquivos enviados vao para o Vercel Blob, e o Firestore guarda apenas metadados, sala, visibilidade, URL e link de download. Para desenvolvimento local, crie um Blob Store no projeto da Vercel e rode:

```bash
vercel env pull
```

Isso traz `BLOB_READ_WRITE_TOKEN` para o `.env.local`.

## OpenAI

Configure `OPENAI_API_KEY` no ambiente server-side. O modelo padrão é `gpt-5.4-mini`, mas pode ser trocado em `OPENAI_MODEL`.

## Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run start
```

## Deploy

### Vercel

Configure as variáveis de ambiente no painel da Vercel e publique com:

```bash
vercel
```

### Firebase Hosting

O `firebase.json` está preparado para Firebase Hosting com suporte a frameworks. Após configurar o Firebase CLI:

```bash
firebase deploy
```
