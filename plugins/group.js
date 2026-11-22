// plugins/group.js
// 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 - روابط المجموعات

import pkg from '@whiskeysockets/baileys'
const { generateWAMessageContent, generateWAMessageFromContent, proto } = pkg

const handler = async (m, { conn }) => {
  try {

    // ════════ روابط المجموعات ════════
    const fixedGroupLinks = {
      group1: 'حط_رابط_الجروب_الأول_هنا',
      group2: 'حط_رابط_الجروب_الثاني_هنا',
    }

    // ════════ الصورة ════════
    async function createImage() {
      const { imageMessage } = await generateWAMessageContent(
        {
          image: {
            url: 'https://upload.satoru.click/files/d10699.jpg'
          }
        },
        {
          upload: conn.waUploadToServer
        }
      )

      return imageMessage
    }

    const groups = [
      {
        name: '「 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 𝙂𝙍𝙊𝙐𝙋 𝟬𝟭 」',
        link: fixedGroupLinks.group1
      },
      {
        name: '「 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 𝙂𝙍𝙊𝙐𝙋 𝟬𝟮 」',
        link: fixedGroupLinks.group2
      },
    ]

    const imageMsg = await createImage()

    const cards = groups.map(group => ({
      body: proto.Message.InteractiveMessage.Body.fromObject({
        text:
`╔══════════════╗
       ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦
╚══════════════╝

┌─「 𝙇𝙄𝙉𝙆 𝙄𝙉𝙁𝙊 」─┐
│
│  ${group.name}
│
└────────────────

⌁ انضم الآن إلى مجتمع 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓`
      }),

      footer: proto.Message.InteractiveMessage.Footer.fromObject({
        text: '⌁ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 𝘽𝙊𝙏 • 𝙊𝙁𝙁𝙄𝘾𝙄𝘼𝙇 ⌁'
      }),

      header: proto.Message.InteractiveMessage.Header.fromObject({
        hasMediaAttachment: true,
        imageMessage: imageMsg
      }),

      nativeFlowMessage:
        proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          buttons: [{
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: '「 🔗 فتح الرابط 」',
              url: group.link
            })
          }]
        })
    }))

    const slideMessage = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },

            interactiveMessage:
              proto.Message.InteractiveMessage.fromObject({

                body: proto.Message.InteractiveMessage.Body.create({
                  text:
`╔════════════════════╗
       ✦ 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 ✦
╚════════════════════╝

┌──「 𝙂𝙍𝙊𝙐𝙋𝙎 」──┐
│
│  ✧ روابط مجموعات البوت
│  ✧ اختر المجموعة المناسبة لك
│
└────────────────────────┘`
                }),

                footer:
                  proto.Message.InteractiveMessage.Footer.create({
                    text: '⌁ 𝙒𝙀𝙇𝘾𝙊𝙈𝙀 𝙏𝙊 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 𝙉𝙀𝙏𝙒𝙊𝙍𝙆 ⌁'
                  }),

                carouselMessage:
                  proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                    cards
                  })
              })
          }
        }
      },
      {}
    )

    await conn.relayMessage(
      m.chat,
      slideMessage.message,
      {
        messageId: slideMessage.key.id
      }
    )

    await m.react('✨')

  } catch (e) {
    console.error('𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓 Group Error:', e)
    await m.reply('❌ حصل خطأ أثناء إرسال روابط 𝐀𝐑𝐓𝐇𝐔𝐑 𝐁𝐎𝐓.')
  }
}

handler.command = ['group', 'مجموعة', 'قروبات', 'دعم']

export default handler