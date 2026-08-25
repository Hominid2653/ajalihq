def question_marks(str_):
    last_num = None
    q_count = 0
    found = False

    for ch in str_:
        if ch.isdigit():
            num = int(ch)
            if last_num is not None and last_num + num == 10:
                if q_count != 3:
                    return "false"
                found = True
            last_num = num
            q_count = 0
        elif ch == '?':
            q_count += 1
        # letters fall through and are ignored — no branch matches them

    return "true" if found else "false"