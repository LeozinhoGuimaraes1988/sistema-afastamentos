# Sistema de Gerenciamento de Afastamentos 🚀

Este é um sistema desenvolvido para facilitar o gerenciamento de férias, abonos, licenças-prêmio e licenças médicas de servidores públicos, oferecendo uma interface intuitiva e funcionalidades essenciais para uma gestão eficiente, tudo tendo sido desenvolvido com React.js. Possui autenticação, logs de alteração, cálculo automático de dias úteis.

---

## 🖥️ **Demonstração**
![image](https://github.com/user-attachments/assets/e9f8cb78-5e19-4106-9b5e-afe9f64576b5)
![image](https://github.com/user-attachments/assets/e83062be-d570-4cc4-856f-26829be2c720)



---

## 📌 Funcionalidades Principais

- ✅ **Gestão de Férias:** Controle de períodos com validação de combinações de dias válidas.
- ✅ **Abonos:** Inserção e verificação para evitar sobreposição com férias.
- ✅ **Licenças-prêmio e Médicas:** Cadastro detalhado por tipo de licença ou atestado.
- ✅ **Paginação:** Suporte a grandes volumes de dados com carregamento sob demanda.
- ✅ **Cálculo automático:** Conversão de datas em dias úteis.
- ✅ **Notificações visuais:** Toasts em tempo real com `react-hot-toast`.
- ✅ **Autenticação com Firebase:** Controle de acesso via login e permissões (admin/usuário).
- ✅ **Sistema de logs:** Registro detalhado das alterações feitas no sistema.
- ✅ **Multi-clientes:** Separação de dados por `clienteId` (multi-tenant).

---

## 🛠️ Tecnologias Utilizadas

### Front-end

- **React.js**
- **CSS Modules**
- **Context API**
- **React DatePicker**
- **React Modal**
- **React Hot Toast**
- **Vite**

### Back-end

- **Node.js + Express**
- **Firebase Admin SDK**
- **JWT para autenticação**
- **Verificação de claims**
- **Middlewares personalizados**
- **Rotas protegidas**

---

