import cv2
import face_recognition

# تحميل صورة الوجه المصرح به
authorized_image = face_recognition.load_image_file("face.png")
authorized_encoding = face_recognition.face_encodings(authorized_image)[0]

# فتح الكاميرا
video_capture = cv2.VideoCapture(0)

while True:
    ret, frame = video_capture.read()
    rgb_frame = frame[:, :, ::-1]  # تحويل BGR إلى RGB

    face_locations = face_recognition.face_locations(rgb_frame)
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

    for face_encoding in face_encodings:
        matches = face_recognition.compare_faces([authorized_encoding], face_encoding)
        if matches[0]:
            print("وجه مصرح به")
        else:
            print("تحذير: وجه غير مصرح به!")

    # عرض الكاميرا في نافذة
    cv2.imshow('Video', frame)

    # الخروج بالضغط على 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows()