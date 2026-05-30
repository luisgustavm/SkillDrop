# SkillDrop

<<<<<<< HEAD
SkillDrop é uma plataforma web SaaS para estudantes criarem salas privadas, enviarem, organizarem, visualizarem e compartilharem atividades acadêmicas: PDFs, imagens, ZIPs, vídeos, documentos, códigos-fonte, links e projetos.
=======
SkillDrop é uma plataforma web SaaS para estudantes enviarem, organizarem, visualizarem e compartilharem atividades acadêmicas: PDFs, imagens, ZIPs, vídeos, documentos, códigos-fonte, links e projetos.
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472

## Stack

- Next.js 15 App Router, React, TypeScript e TailwindCSS
- Componentes no padrão Shadcn/UI, Framer Motion e Lucide Icons
- Firebase Authentication, Firestore e Hosting
- Arquivos em IndexedDB local do navegador, sem custo de Firebase Storage
- OpenAI API com streaming em `/api/ai/chat`
- Monaco Editor, React Hook Form, Zod e Zustand
<<<<<<< HEAD
- Salas privadas por código ou link, com mensagens e anexos pequenos por sala
=======
>>>>>>> 5fd6ae362174970f3e29bd386dec61cde1224472

## Instalação

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

## Firebase

1. Crie um projeto no Firebase.
2. Ative Authentication com Email/Senha, Google e Anonymous.
3. Crie Firestore.
4. Preencha `.env.local` com as credenciais client e admin.
5. Publique regras e índices:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Uploads sem custo

O SkillDrop não usa Firebase Storage. Os arquivos enviados ficam no IndexedDB do navegador do usuário, e o Firestore armazena somente metadados, tags, comentários, favoritos e links. Isso elimina custo de storage, mas significa que um arquivo local abre apenas no navegador/dispositivo onde foi enviado. Links externos continuam compartilháveis normalmente.

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
